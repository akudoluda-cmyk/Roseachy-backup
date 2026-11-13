/** Original saved-day update guard. Mutates only the incoming record, as before. */
function businessKey(v){return String(v||'').trim().toLowerCase()}
export function normalizedDayRecord(rec,records){
 const existing=records.find(x=>x.date===rec.date&&businessKey(x.business)===businessKey(rec.business));
 if(existing){
  // A previously committed transaction must survive subsequent Save Day updates,
  // including supplier purchases/payments, retail sales, POS and cash movements.
  // Missing IDs indicate a stale or incomplete draft; never overwrite the archive.
  const incoming=Array.isArray(rec.tx)?rec.tx:[];
  const incomingIds=new Set(incoming.map(t=>String(t?.id||'')));
  if(incoming.some(t=>!t?.id)||incomingIds.size!==incoming.length)
   throw Error('Current-day records contain missing or duplicate transaction references. Restore a valid draft before saving.');
  const missing=(existing.tx||[]).filter(t=>!t?.id||!incomingIds.has(String(t.id)));
  if(missing.length)throw Error('This draft is missing '+missing.length+' previously saved transaction(s), including possible supplier or payment records. Restore the complete day before saving; use the existing correction or reversal workflow for intentional changes.');
  rec.id=existing.id;rec.archived=!!existing.archived;
 }
 return {existing,record:rec};
}

/** Plan a history-only change without mutating the working storage collection.
 * The command owner must enforce debt/deletion permissions and persist atomically.
 */
export function planSavedDayChange(records,id,action){
 if(!['archive','delete'].includes(action))throw Error('Unsupported saved-day change.');
 const index=records.findIndex(record=>String(record.id)===String(id));
 if(index<0)return null;
 const previous=records[index],next=records.slice();
 if(action==='archive')next[index]={...previous,archived:!previous.archived};
 else next.splice(index,1);
 return {records:next,previous,record:action==='archive'?next[index]:null};
}
