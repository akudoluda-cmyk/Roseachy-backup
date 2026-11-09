import React, { useRef, useState } from 'react';
const commands = () => window.RoseachyTableCommands;
function action(event, name, ...args) {
  event.stopPropagation();
  return commands()[name](...args);
}
function GroupRow({row}) {
  const kind=row.subdivisionId ? 'subdivision' : 'division';
  return <tr className={row.depth?'classificationSubheading':'classificationHeading'}><td colSpan={9}><div className="classificationHead">
    <button type="button" className="ghost classificationExpand" data-class-toggle={row.key} aria-expanded={row.open}
      onClick={e=>action(e,'stockGroupToggle',row.key,!row.open)}>{row.open?'▾ ':'▸ '}{row.name} <small>({row.count})</small></button>
    {row.manage && <span className="classificationManage">
      <button type="button" className="ghost" data-class-rename={row.manage} data-kind={kind} onClick={e=>action(e,'classificationRename',kind,row.manage)}>Rename</button>
      <button type="button" className="del" data-class-delete={row.manage} data-kind={kind} aria-label={`Remove ${kind}`} onClick={e=>action(e,'classificationDelete',kind,row.manage)}>Remove</button>
      {!row.depth && <button type="button" className="ghost" data-class-add-sub={row.divisionId} onClick={e=>action(e,'classificationAddSub',row.divisionId)}>+ Add Subdivision</button>}
    </span>}
  </div></td></tr>;
}
function ProductRow({row}) {
  const press=useRef(null), heldClick=useRef(false), [pressing,setPressing]=useState(false);
  function cancel(event) { event?.stopPropagation();if(press.current)clearTimeout(press.current.timer);press.current=null;setPressing(false); }
  function down(e) {
    e.stopPropagation();
    if(row.historical||row.multi||e.button>0||e.target.closest('button,input,select,a'))return;
    cancel();heldClick.current=false;setPressing(true);
    press.current={x:e.clientX,y:e.clientY,timer:setTimeout(()=>{press.current=null;heldClick.current=true;setPressing(false);commands().stockSelectStart(row.id)},2000)};
  }
  React.useEffect(()=>()=>{if(press.current)clearTimeout(press.current.timer)},[]);
  const expiry=row.expiry;
  const expiryBadge=expiry.level===4?['expired',`Expired · ${Math.abs(expiry.days)}d ago`]:expiry.level===3?['expirySoon',expiry.days===0?'Expires today':`Expires soon · ${expiry.days}d`]:expiry.level===2?['expiryApproaching',`Expiry approaching · ${expiry.days}d`]:expiry.level===1?['expiryUpcoming',`Upcoming expiry · ${expiry.days}d`]:null;
  return <tr data-stock-row={row.id} className={`${row.className}${pressing?' stockPressing':''}`} onPointerDown={down}
    onPointerMove={e=>{e.stopPropagation();if(press.current&&Math.hypot(e.clientX-press.current.x,e.clientY-press.current.y)>12)cancel();}}
    onPointerUp={cancel} onPointerCancel={cancel} onPointerLeave={cancel}
    onContextMenu={e=>{if(press.current||row.multi)e.preventDefault();}}
    onClickCapture={e=>{if(heldClick.current){heldClick.current=false;e.preventDefault();e.stopPropagation();}}}
    onClick={e=>{e.stopPropagation();if(row.multi&&!e.target.closest('button,input,select,a'))commands().stockToggle(row.id)}}>
    <td><div className="stockSelectCell">{row.multi&&<input type="checkbox" className="stockSelectBox" data-stock-select={row.id} checked={row.selected} aria-label={`Select ${row.name}`} onChange={()=>commands().stockToggle(row.id)} />}
      <span>{row.name} <span className={`divDot ${row.dotKey}`} title={row.divisionLabel} aria-label={row.divisionLabel}/><small className="classificationPath">{row.path}</small></span></div></td>
    <td className="num"><div className="qtyDisplay"><div className="qtyMain">{row.quantity.main}</div>{row.quantity.sub&&<div className="qtySub">{row.quantity.sub}</div>}</div></td>
    <td className="num">{row.cost}</td><td className="num">{row.price}{row.quantityPrice&&<div className="small">{row.quantityPrice}</div>}</td>
    <td className="num">{row.value}</td><td className="num">{row.profit}</td><td>{row.expiryDate||'—'}</td>
    <td>{row.low&&<span className="badge low">Low stock</span>}{expiryBadge&&<span className={`badge ${expiryBadge[0]}`}>{expiryBadge[1]}</span>}{!row.low&&!expiry.level&&<span className="badge ok">OK</span>}</td>
    <td>{row.historical?'—':<><button type="button" className="iconbtn" data-sedit={row.id} onClick={e=>action(e,'stockEdit',row.id)}>Edit</button>{' '}<button type="button" className="iconbtn del" data-sdel={row.id} onClick={e=>action(e,'stockDelete',row.id)}>Delete</button></>}</td>
  </tr>;
}
export function StockInventoryRows({rows}) {
  return rows.map(row=>row.kind==='product'?<ProductRow key={row.id} row={row}/>:row.kind==='group'?<GroupRow key={row.key} row={row}/>:row.kind==='more'?<tr key="more" className="perfMoreRow noPrint"><td colSpan={9}><button type="button" className="ghost perfMoreBtn" data-stock-more onClick={e=>action(e,'stockMore')}>Load {row.count} more</button><div className="small">Showing {row.shown} of {row.total} matching stock items</div></td></tr>:<tr key="empty"><td colSpan={9} className="empty">No stock added yet</td></tr>);
}
