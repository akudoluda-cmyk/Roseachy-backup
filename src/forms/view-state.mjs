import { flushSync } from 'react-dom';

/** Synchronous presentation notifications for the remaining controller boundary. */
export function createViewState(initial) {
  let snapshot=Object.freeze(initial);
  const listeners=new Set();
  return {
    getSnapshot:()=>snapshot,
    subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
    patch(values){
      if(Object.entries(values).every(([k,v])=>snapshot[k]===v))return;
      flushSync(()=>{snapshot=Object.freeze({...snapshot,...values});for(const listener of listeners)listener();});
    },
  };
}
