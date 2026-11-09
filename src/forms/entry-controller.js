import { flushSync } from 'react-dom';
import { createFormState } from './form-state.mjs';
import tree from '../components/legacy-tree.json';

export function createEntryController({rootId, actionIds}) {

// Transitional interop is confined to the Stock entry fields. Draft values live
// in formState; the old business commands remain the only persistent writers.
const fields = {};
const STOCK_ACTIONS = new Set(actionIds);
function textOf(node) {
  return typeof node === 'string' ? node : node.children.map(textOf).join('');
}
function visit(node, inside = false) {
  if (typeof node === 'string') return;
  inside ||= node.props?.id === rootId;
  if (inside && ['input','select','textarea'].includes(node.tag) && node.props.id) {
    const options = node.tag === 'select' ? node.children.filter(n => typeof n !== 'string' && n.tag === 'option').map(n => ({value:n.props.value ?? textOf(n), label:textOf(n), disabled:!!n.props.disabled})) : null;
    fields[node.props.id] = {value:String(node.props.defaultValue ?? options?.[0]?.value ?? ''), checked:!!node.props.defaultChecked, disabled:!!node.props.disabled, readOnly:!!node.props.readOnly, options};
  }
  if (STOCK_ACTIONS.has(node.props?.id)) fields[node.props.id] = {label:textOf(node), disabled:!!node.props.disabled};
  for (const child of node.children) visit(child, inside);
}
tree.forEach(node => visit(node));
const STOCK_FIELDS = new Set(Object.keys(fields).filter(id => !STOCK_ACTIONS.has(id)));
const stockFormState = createFormState(fields);
const handlers = new Map();
const facades = new WeakMap();
const managedEvents = new Set(['input','change','blur','click']);
function patch(id, values) {
  // Legacy setters require immediate visibility (e.g. selectedOptions) before
  // the next calculation. This is only called by events/async controller boot.
  flushSync(() => stockFormState.patch(id, values));
}
function callbacks(id, type) { return handlers.get(`${id}:${type}`) || []; }
function stockFormElement(id, element) {
  if (!element || !Object.hasOwn(fields, id)) return element;
  if (facades.has(element)) return facades.get(element);
  const proxy = new Proxy(element, {
    get(target, key) {
      const field = stockFormState.getSnapshot().fields[id];
      if (['value','checked','disabled','readOnly'].includes(key) && Object.hasOwn(field,key)) return field[key];
      if (key === 'textContent' && STOCK_ACTIONS.has(id)) return field.label;
      if (key === 'addEventListener') return (type, callback, options) => {
        if (!managedEvents.has(type) || (type === 'change' && target.tagName !== 'SELECT' && target.type !== 'checkbox')) return target.addEventListener(type,callback,options);
        const name=`${id}:${type}`;
        const list=handlers.get(name) || [];
        if (!list.includes(callback)) handlers.set(name,[...list,callback]);
      };
      if (key === 'dispatchEvent') return event => {
        if (!managedEvents.has(event.type) || (event.type === 'change' && target.tagName !== 'SELECT' && target.type !== 'checkbox')) return target.dispatchEvent(event);
        dispatchStockField(id,event.type,{target, currentTarget:target});
        return true;
      };
      const value = Reflect.get(target,key,target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set(target, key, value) {
      if (['value','checked','disabled','readOnly'].includes(key)) {
        patch(id,{[key]:key === 'value' ? String(value ?? '') : !!value});
        return true;
      }
      if (key === 'textContent' && STOCK_ACTIONS.has(id)) { patch(id,{label:String(value)}); return true; }
      if (key === 'innerHTML' && target.tagName === 'SELECT') {
        const select = document.createElement('select');
        select.innerHTML = value;
        const options = Array.from(select.options, o => ({value:o.value,label:o.textContent,disabled:o.disabled}));
        // Match the native select replacement semantics, including selected attrs.
        patch(id,{options,value:select.value});
        return true;
      }
      return Reflect.set(target,key,value,target);
    },
  });
  facades.set(element,proxy);
  return proxy;
}
function dispatchStockField(id, type, event) {
  const el = event.currentTarget;
  const target = stockFormElement(id,el);
  patch(id,{value:el.value,checked:!!el.checked});
  const adapted={type,target,currentTarget:target,preventDefault:()=>event.preventDefault?.(),stopPropagation:()=>event.stopPropagation?.()};
  for (const fn of callbacks(id,type)) fn(adapted);
}
function runStockAction(id) {
  return stockFormState.command(id, async () => {
    const list=callbacks(id,'click');
    if (!list.length) throw new Error('Entry form is still loading. Please try again.');
    for (const fn of list) await fn();
  });
}

return {fields:STOCK_FIELDS, actions:STOCK_ACTIONS, state:stockFormState, element:stockFormElement, dispatch:dispatchStockField, run:runStockAction};
}
