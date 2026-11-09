"""Original-vs-React POS and cash-move workflows with real IndexedDB."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from tempfile import TemporaryDirectory
import json,zipfile,hashlib,sys
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
WIDTH=390 if '--mobile' in sys.argv else 1280
OUT=ROOT/'tests/evidence'/f'pos-{WIDTH}';OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass

def fixture(browser,root,label):
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
 context=browser.new_context(service_workers='block',viewport={'width':WIDTH,'height':900});page=context.new_page();errors=[];checks=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 context.tracing.start(screenshots=True,snapshots=True)
 def ok(name):checks.append(name);print('PASS',label,WIDTH,name,flush=True)
 def rows():return page.evaluate('RoseachyStore.getObject("dsb_draft_v2").tx')
 def saved():page.evaluate('RoseachyStore.whenSaved()')
 def submit(count):
  page.locator('#posAddBtn').click();page.wait_for_function('(n)=>RoseachyStore.getObject("dsb_draft_v2").tx.length===n',arg=count);saved()
 def enter(ty,amount,fee):
  page.locator('#posType').select_option(ty);page.locator('#posA').fill(str(amount));page.locator('#posFee').fill(str(fee))
 def edit(index):page.locator(f'#ledger [data-edit="{index}"]').click();saved()
 def move(direction,amount,note,count):
  page.locator('#moveCashBtn').click();page.locator('#xferDir').select_option(direction);page.locator('#xferAmt').fill(str(amount));page.locator('#xferNote').fill(note)
  page.locator('#xferOk').evaluate('(b)=>{b.click();b.click()}');expect(page.locator('#xferOverlay')).not_to_be_visible();saved();assert len(rows())==count
 try:
  page.goto(f'http://127.0.0.1:{server.server_port}');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
  for key,value in [('openingCash','500'),('posOpeningCash','1000'),('posOpeningElectronic','1000')]:page.locator('#'+key).fill(value)
  page.locator('#entryMode [data-mode="pos"]').click();saved()
  page.locator('#posAddBtn').click();expect(page.locator('#posWarn')).to_contain_text('greater than zero');assert not rows()
  enter('pos_withdrawal',200,10)
  page.locator('#posFeeViaSeg [data-via="cash"]').click();expect(page.locator('#posFeeViaSeg [data-via="cash"]')).to_have_class('active')
  page.locator('#posFeeViaSeg [data-via="elec"]').click();expect(page.locator('#posFeeViaSeg [data-via="elec"]')).to_have_class('active')
  page.locator('#posRef').fill('POS-FIXTURE')
  page.locator('#posEntry summary').click();page.locator('#posParty').fill('Fixture customer');page.locator('#posChannel').select_option('POS terminal')
  page.locator('#posAddBtn').evaluate('(b)=>{b.click();b.click()}');page.wait_for_function('RoseachyStore.getObject("dsb_draft_v2").tx.length===1');saved()
  t=rows()[0];assert t['pos']=={'cashIn':0,'cashOut':200,'elecIn':210,'elecOut':0,'fee':10,'feeVia':'elec','principal':200}
  assert t['ref']=='POS-FIXTURE' and t['party']=='Fixture customer';expect(page.locator('#posBal')).to_contain_text('₦800.00');expect(page.locator('#posBal')).to_contain_text('₦1,210.00')
  page.locator('#ledger [data-tog]').first.click();expect(page.locator('#ledger')).to_contain_text('Cash paid out');expect(page.locator('#ledger')).to_contain_text('Card/transfer received');page.locator('#ledger [data-tog]').first.click()
  ok('invalid amount blocked; fee selection, movement details and duplicate-click withdrawal')
  edit(0);expect(page.locator('#posA')).to_have_value('200');page.locator('#posA').fill('250');submit(1)
  assert rows()[0]['id']==t['id'] and rows()[0]['ts']==t['ts'] and rows()[0]['pos']['cashOut']==250
  edit(0);page.locator('#posA').fill('300');page.locator('#posCancelEditBtn').click();assert rows()[0]['amount']==250
  ok('edit retains identity/time; cancel leaves amounts unchanged')
  enter('pos_transfer',100,5);submit(2);assert rows()[1]['pos']['cashIn']==105 and rows()[1]['pos']['feeVia']=='cash'
  enter('pos_deposit',50,2);submit(3);expect(page.locator('#posBal')).to_contain_text('₦907.00');expect(page.locator('#posBal')).to_contain_text('₦1,110.00')
  ok('transfer and deposit default to cash charges and reconcile both balances')
  enter('pos_withdrawal',5000,0);page.locator('#posAddBtn').click();expect(page.locator('#posShort')).to_contain_text('Insufficient POS cash');assert len(rows())==3
  page.locator('#posShortCancel').click();expect(page.locator('#posShort')).not_to_be_visible()
  enter('pos_transfer',5000,0);page.locator('#posAddBtn').click();expect(page.locator('#posWarn')).to_contain_text('Insufficient POS electronic');assert len(rows())==3
  ok('cash/electronic shortages reject without new records')
  enter('pos_withdrawal',100,1);before=rows()
  page.evaluate('''()=>{const put=IDBObjectStore.prototype.put;let count=2;IDBObjectStore.prototype.put=function(...args){if(this.name==='draft'&&args[0]?.tx?.length===4&&args[0].tx.at(-1)?.type==='pos_withdrawal'&&args[0].tx.at(-1)?.amount===100&&count-->0){if(!count)IDBObjectStore.prototype.put=put;throw new DOMException('POS write fault','QuotaExceededError')}return put.apply(this,args)}}''')
  page.locator('#posAddBtn').click();expect(page.locator('#toast')).to_contain_text('Nothing saved:');assert rows()==before
  expect(page.locator('#posA')).to_have_value('100');expect(page.locator('#posFee')).to_have_value('1');submit(4)
  ok('both commit attempts fail atomically; form retained; retry creates one record')
  page.locator('#ledger [data-del="1"]').click();page.wait_for_function('RoseachyStore.getObject("dsb_draft_v2").tx.length===3');saved()
  expect(page.locator('#posBal')).to_contain_text('₦702.00');expect(page.locator('#posBal')).to_contain_text('₦1,311.00')
  ok('deleting transfer reverses cash, electronic and fee effects once')
  move('r2p',100,'Float top up',4);move('p2r',50,'Return float',5)
  page.locator('#moveCashBtn').click();page.locator('#xferDir').select_option('padd');page.locator('#xferAmt').fill('25');page.locator('#xferOk').click()
  expect(page.locator('#xferErr')).to_contain_text('reason');assert len(rows())==5;page.locator('#xferCancel').click()
  move('padd',25,'Owner float',6);move('prem',20,'Owner withdrawal',7)
  page.locator('#moveCashBtn').click();page.locator('#xferDir').select_option('ts2p');page.locator('#xferAmt').fill('100');page.locator('#xferOk').click()
  expect(page.locator('#xferErr')).to_contain_text('Insufficient cash from today');assert len(rows())==7;page.locator('#xferCancel').click()
  expect(page.locator('#posBal')).to_contain_text('₦757.00');expect(page.locator('#posBal')).to_contain_text('₦1,311.00');expect(page.locator('#mCash')).to_have_text('₦450.00')
  ok('cash transfers/adjustments conserve balances; reason and sales-pool guards enforced')
  before=rows();edit(3);expect(page.locator('#xferAmt')).to_have_value('100');page.locator('#xferAmt').fill('150')
  page.evaluate('''()=>{const put=IDBObjectStore.prototype.put;let count=2;IDBObjectStore.prototype.put=function(...args){if(this.name==='draft'&&args[0]?.tx?.length===7&&args[0].tx[3]?.type==='cash_transfer'&&args[0].tx[3]?.amount===150&&count-->0){if(!count)IDBObjectStore.prototype.put=put;throw new DOMException('Cash move write fault','QuotaExceededError')}return put.apply(this,args)}}''')
  page.locator('#xferOk').click();expect(page.locator('#toast')).to_contain_text('Nothing saved:');assert rows()==before
  expect(page.locator('#xferOverlay')).to_be_visible();expect(page.locator('#xferAmt')).to_have_value('150')
  page.locator('#xferOk').click();expect(page.locator('#xferOverlay')).not_to_be_visible();saved()
  assert rows()[3]['amount']==150 and rows()[3]['id']==before[3]['id'] and rows()[3]['ts']==before[3]['ts']
  expect(page.locator('#mCash')).to_have_text('₦400.00');expect(page.locator('#posBal')).to_contain_text('₦807.00')
  edit(3);page.locator('#xferAmt').fill('100');page.locator('#xferOk').click();expect(page.locator('#xferOverlay')).not_to_be_visible();saved()
  expect(page.locator('#mCash')).to_have_text('₦450.00');expect(page.locator('#posBal')).to_contain_text('₦757.00')
  page.locator('#moveCashBtn').click();page.locator('#xferAmt').fill('99')
  if label=='react':
   page.locator('#xferCancel').focus();page.keyboard.press('Tab');expect(page.locator('#xferDir')).to_be_focused()
   page.keyboard.press('Shift+Tab');expect(page.locator('#xferCancel')).to_be_focused()
  page.keyboard.press('Escape');expect(page.locator('#xferOverlay')).not_to_be_visible();assert len(rows())==7
  ok('cash-move failed edit preserves draft; retry/second edit reconcile balances; Escape cancels')

  # The baseline no longer offers creation of these archived POS types. Seed
  # synthetic old-format records into real IDB, then exercise their real UI edits.
  page.evaluate('''async()=>{
    const draft=RoseachyStore.getObject('dsb_draft_v2'),base=draft.tx[0];
    const legacy=[['pos_collection',0,100,0],['pos_collect_transfer',0,101,40],['pos_collect_withdraw',40,101,0]].map(([type,cashOut,elecIn,elecOut],i)=>{
      const row={...base,id:'fixture-legacy-'+i,type,amount:100,unitPrice:100,note:'Legacy fixture '+i,ref:'LEGACY-'+i,party:'Fixture customer',pos:{cashIn:0,cashOut,elecIn,elecOut,fee:i?1:0,feeVia:'elec',principal:100}};
      delete row.editedAt;return row;
    });
    await RoseachyStore.atomic(()=>RoseachyStore.set('dsb_draft_v2',JSON.stringify({...draft,tx:[...draft.tx,...legacy]})));
  }''')
  page.reload(wait_until='networkidle');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
  if page.locator('#xferOverlay').is_visible():page.locator('#xferCancel').click()
  for index,ty in enumerate(['pos_collection','pos_collect_transfer','pos_collect_withdraw'],7):
   original=rows()[index];edit(index);expect(page.locator('#posType')).to_have_value(ty)
   expect(page.locator(f'#posType option[value="{ty}"]')).to_have_text('Legacy · '+{'pos_collection':'Card / transfer collection','pos_collect_transfer':'Collection + transfer','pos_collect_withdraw':'Collection + cash out'}[ty])
   if ty!='pos_collection':expect(page.locator('#posB')).to_have_value('40')
   page.locator('#posA').fill('120');submit(10)
   assert rows()[index]['id']==original['id'] and rows()[index]['ts']==original['ts'] and rows()[index]['pos']['principal']==120
   expect(page.locator('#posType')).to_have_value('pos_withdrawal');assert page.locator('#posType option[data-legacy]').count()==0
  ok('all three legacy POS types hydrate, edit and remove temporary options without identity loss')
  before=rows();page.reload(wait_until='networkidle');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined');assert rows()==before
  assert page.evaluate('RoseachyStore.verify()')['ok'];assert not errors,errors
  if label=='react':assert page.evaluate('(()=>{const ids=[...document.querySelectorAll("[id]")].map(x=>x.id);return ids.length===new Set(ids).size})()')
  if page.locator('#xferOverlay').is_visible():page.locator('#xferCancel').click()
  page.locator('#entryMode [data-mode="pos"]').click();page.screenshot(path=str(OUT/f'{label}-pos.png'),full_page=True)
  ok('reload, exact transaction durability and real database verification')
  state=page.evaluate('({draft:RoseachyStore.getObject("dsb_draft_v2"),trash:RoseachyStore.getObject("dsb_tx_trash_v2"),stock:RoseachyStore.getObject("dsb_stock_v2"),balances:document.getElementById("posBal").textContent})')
  ids={}
  def normalize(v,key=''):
   if isinstance(v,dict):
    for k,value in v.items():
     if (k=='id' or k.endswith('Id')) and isinstance(value,str):ids.setdefault(value,f'id-{len(ids)}')
    return {ids.get(k,k):normalize(x,k) for k,x in v.items()}
   if isinstance(v,list):return [normalize(x) for x in v]
   if isinstance(v,str):
    if key in ['ts','editedAt','createdAt','updatedAt','deletedAt']:return '<time>'
    if key=='ref' and v.startswith('MC-'):return '<generated-cash-move-reference>'
    return ids.get(v,v)
   return v
  state=normalize(state);(OUT/f'{label}-normalized.json').write_text(json.dumps(state,indent=2));(OUT/f'{label}-results.json').write_text(json.dumps({'passed':len(checks),'checks':checks},indent=2));context.tracing.stop();return state
 except Exception:
  page.screenshot(path=str(OUT/f'{label}-failure.png'),full_page=True);context.tracing.stop(path=str(OUT/f'{label}-failure.zip'));raise
 finally:context.close();server.shutdown();server.server_close()

archive=ROOT/'reference/original-2.17.2.zip';assert hashlib.sha256(archive.read_bytes()).hexdigest()=='55a9a1ba418c910d2065240bffe4a385a449f285f8e973cd335e9722be9e1a04'
with TemporaryDirectory() as temp,sync_playwright() as pw:
 with zipfile.ZipFile(archive) as z:z.extractall(temp)
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  original=fixture(browser,Path(temp),'original');react=fixture(browser,ROOT/'dist','react');assert original==react,'POS parity differs; inspect normalized records'
  print('PASS all normalized POS/cash-move working-day, trash, stock and balance fields match original',flush=True)
 finally:browser.close()
