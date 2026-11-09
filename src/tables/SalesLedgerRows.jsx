import React from 'react';
function command(e,name,...args){e.stopPropagation();return window.RoseachyTableCommands[name](...args)}
function Details({details}) {
  return <tr className="txDetail"><td colSpan={7}><div className="txDetailIn">
    <div className="recordMetaGrid">{details.meta.map(([label,value],i)=><div key={i}><span>{label}</span><b>{value}</b></div>)}</div>
    {!!details.movements.length&&<div style={{marginTop:10}}>{details.movements.map((m,i)=><React.Fragment key={i}>{m.breakBefore&&<br/>}<span className={`mv${m.muted?' tdMuted':''}`}>{m.prefix}{m.strong&&<b>{m.strong}</b>}{m.text}</span></React.Fragment>)}</div>}
  </div></td></tr>;
}
function TransactionRow({row}) {
 return <><tr className={row.className} data-transaction-id={row.id}>
  <td className="recType">{row.type}{row.source&&<div className="stamp">{row.source}</div>}{row.recorded&&<div className="stamp">{row.recorded}</div>}{row.groupLabel&&<span className="heldGroupTag">{row.groupLabel}</span>}</td>
  <td><button type="button" className="rowToggle" data-tog={row.id} aria-label={`${row.expanded?'Hide':'Show'} record details`} onClick={e=>command(e,'ledgerToggle',row.id)}>{row.expanded?'▾':'▸'}</button>{row.reference}</td>
  <td className="recDiv">{row.division?<span className={`badge ${row.division.className}`}>{row.division.label}</span>:'—'}</td>
  <td className="recParty">{row.party}</td><td className="num">{row.quantity}</td>
  <td className="num">{row.amount}{row.owed&&<> <span className="badge low">Owes {row.owed}</span></>}{row.effects.map((effect,i)=><div key={i} className={effect.className}>{effect.text}</div>)}</td>
  <td>{row.canEdit&&<><button type="button" className="iconbtn" data-edit={row.index} onClick={e=>command(e,'ledgerEdit',row.id)}>{row.editLabel}</button>{' '}</>}{row.canDelete&&<button type="button" className="iconbtn del" data-del={row.index} onClick={e=>command(e,'ledgerDelete',row.id)}>{row.deleteLabel}</button>}</td>
 </tr>{row.details&&<Details details={row.details}/>}</>;
}
export function SalesLedgerRows({rows}) {
 return rows.map(row=>row.kind==='transaction'?<TransactionRow key={row.id} row={row}/>:row.kind==='more'?<tr key="more" className="perfMoreRow noPrint"><td colSpan={7}><button type="button" className="ghost perfMoreBtn" data-ledger-more onClick={e=>command(e,'ledgerMore')}>Load {row.count} older records</button><div className="small">Showing {row.shown} of {row.total} matching records</div></td></tr>:<tr key="empty"><td colSpan={7} className="empty">No matching transactions</td></tr>);
}
