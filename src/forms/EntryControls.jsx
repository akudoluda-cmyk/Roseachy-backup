import React, { useSyncExternalStore } from 'react';


export function EntryField({ node, controller, desk, presentation = {} }) {
  const snapshot = useSyncExternalStore(controller.state.subscribe, controller.state.getSnapshot);
  const field = snapshot.fields[node.props.id];
  const {defaultValue, defaultChecked, ...original} = node.props;
  const props={...original, [`data-react-${desk}-field`]:node.props.id, disabled:field.disabled, readOnly:field.readOnly};
  if (node.props.type === 'checkbox') {
    props.checked=field.checked;
    props.onChange=e=>controller.dispatch(node.props.id,'change',e);
  } else {
    props.value=field.value;
    props.onChange=node.tag === 'select' ? e=>controller.dispatch(node.props.id,'change',e) : ()=>{};
    if (node.tag !== 'select') props.onInput=e=>controller.dispatch(node.props.id,'input',e);
  }
  props.onBlur=e=>controller.dispatch(node.props.id,'blur',e);
  return React.createElement(node.tag, {...props,...presentation}, field.options ? field.options.map((o,index)=><option key={`${o.value}:${index}`} value={o.value} disabled={o.disabled} data-legacy={o.legacy?'1':undefined}>{o.label}</option>) : undefined);
}
export function EntryAction({ node, controller, desk }) {
  const snapshot=useSyncExternalStore(controller.state.subscribe,controller.state.getSnapshot);
  const id=node.props.id, field=snapshot.fields[id], busy=!!snapshot.pending[id];
  return <button {...node.props} type="button" {...{[`data-react-${desk}-action`]:id}} disabled={field.disabled||busy}
    aria-busy={busy} onClick={()=>{controller.run(id).catch(()=>{});}}>{field.label}</button>;
}
export function EntryError({controller}) {
  const snapshot=useSyncExternalStore(controller.state.subscribe,controller.state.getSnapshot);
  return snapshot.error ? <p role="alert" className="warnText">{snapshot.error}</p> : null;
}
