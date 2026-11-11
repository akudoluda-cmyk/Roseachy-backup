"""Day save/transition/history parity against the immutable original; real IDB."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from tempfile import TemporaryDirectory
from datetime import datetime, timezone
import json,zipfile,hashlib,sys
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
WIDTH=390 if '--mobile' in sys.argv else 1280
OUT=ROOT/'tests/evidence'/f'days-{WIDTH}';OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass

def fixture(browser,root,label):
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
 context=browser.new_context(service_workers='block',timezone_id='Africa/Lagos',viewport={'width':WIDTH,'height':900});page=context.new_page();errors=[];checks=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());context.tracing.start(screenshots=True,snapshots=True)
 def ok(name):checks.append(name);print('PASS',label,WIDTH,name,flush=True)
 def get(key):return page.evaluate('(key)=>RoseachyStore.getObject(key)',key)
 def settled():page.evaluate('RoseachyStore.whenSaved()')
 def snapshot():return {k:get(k) for k in ['dsb_saved_v2','dsb_draft_v2','dsb_stock_v2']}
 def history():
  toggle=page.locator('[data-target="dataHistoryBody"]')
  if toggle.get_attribute('aria-expanded')!='true':toggle.click()
 def save():
  page.locator('#saveBtn').click();expect(page.locator('#toast')).to_contain_text('saved successfully');settled()
 def fail_put(condition):
  page.evaluate('''condition=>{const test=new Function('store','value','return '+condition),put=IDBObjectStore.prototype.put;let count=2;window.__dayFaults=0;IDBObjectStore.prototype.put=function(...args){if(test(this.name,args[0])&&count-->0){window.__dayFaults++;if(!count)IDBObjectStore.prototype.put=put;throw new DOMException('Day fixture write fault','QuotaExceededError')}return put.apply(this,args)}}''',condition)
 try:
  page.clock.set_fixed_time(datetime(2026,11,9,10,tzinfo=timezone.utc))
  page.goto(f'http://127.0.0.1:{server.server_port}');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
  for key,value in [('openingCash','100'),('posOpeningCash','500'),('posOpeningElectronic','700'),('openingDebt','50')]:page.locator('#'+key).fill(value)
  page.locator('#tabBtnStock').click();page.locator('[data-target="stockEntryBody"]').click();page.locator('#stockDivision').select_option('essentials')
  for key,value in [('stockName','History Product <b>literal</b>'),('stockQty','12'),('stockCost','200'),('stockPrice','300')]:page.locator('#'+key).fill(value)
  page.locator('#stockAddBtn').click();expect(page.locator('#stockTable')).to_contain_text('History Product');settled()
  page.locator('#tabBtnTx').click();page.locator('#note').fill('History Product');page.locator('[data-product-suggest]').click();page.locator('#qty').fill('2');page.locator('#custPaid').fill('600');page.locator('#addBtn').click();expect(page.locator('#mCash')).to_have_text('₦700.00');settled()
  before=snapshot();fail_put("store==='savedDayRecords' && value.tx?.length===1")
  page.locator('#saveBtn').click();expect(page.locator('#toast')).to_contain_text('Day not saved');settled()
  assert page.evaluate('__dayFaults')==2 and snapshot()==before
  ok('failed saved-day commit leaves active draft, stock and archive unchanged')
  page.locator('#saveBtn').evaluate('(b)=>{b.click();b.click()}');expect(page.locator('#toast')).to_contain_text('Day saved successfully');settled()
  records=get('dsb_saved_v2');assert len(records)==1;first=records[0];day_id=first['id'];day=first['date'];assert day=='2026-11-09'
  assert first['tx']==before['dsb_draft_v2']['tx'];pid=first['tx'][0]['productId'];assert first['openingStock'][pid]['qty']==12 and first['closingStock'][pid]['qty']==10
  assert first['fields']['openingCash']==100 and first['fields']['posOpeningElectronic']==700
  page.locator('#saveBtn').click();expect(page.locator('#toast')).to_contain_text('Saved day updated successfully');settled();assert len(get('dsb_saved_v2'))==1 and get('dsb_saved_v2')[0]['id']==day_id
  ok('save and duplicate click create one snapshot; update preserves day and transaction identities')
  history();expect(page.locator('#savedCount')).to_have_text('1 saved day');expect(page.locator('#savedList')).to_contain_text('₦600.00');expect(page.locator('#savedList')).to_contain_text('₦700.00')
  page.locator('#savedRangeFilter [data-saved-range="custom"]').click();page.locator('#savedFrom').fill('2026-11-10');page.locator('#savedFrom').blur();expect(page.locator('#savedList')).to_contain_text('No saved days')
  page.locator('#savedFrom').fill(day);page.locator('#savedTo').fill(day);page.locator('#savedTo').blur();expect(page.locator('#savedCount')).to_have_text('1 saved day')
  for mode in ['week','month','recent']:
   page.locator(f'#savedRangeFilter [data-saved-range="{mode}"]').click();expect(page.locator('#savedCount')).to_have_text('1 saved day')
  page.locator('#savedList [data-archive-id]').click();settled();expect(page.locator('#savedCount')).to_have_text('0 saved days');assert get('dsb_saved_v2')[0]['archived']
  page.locator('#savedRangeFilter [data-saved-range="archived"]').click();expect(page.locator('#savedList')).to_contain_text('Archived')
  page.locator('#savedList [data-archive-id]').click();settled();expect(page.locator('#savedCount')).to_have_text('0 saved days');assert not get('dsb_saved_v2')[0]['archived']
  page.locator('#savedRangeFilter [data-saved-range="recent"]').click()
  ok('recent/week/month/custom/archive filters and archive/restore preserve the snapshot')
  before=snapshot();page.locator('#savedList [data-load-id]').first.focus();page.keyboard.press('Enter');expect(page.locator('#historyBar')).to_be_visible()
  for key in ['saveBtn','clearBtn','openingCash','actualCash']:expect(page.locator('#'+key)).to_be_disabled()
  expect(page.locator('#txEntryCard')).not_to_be_visible();expect(page.locator('#mCash')).to_have_text('₦700.00');assert snapshot()==before
  page.locator('#backCurrentBtn').click();expect(page.locator('#historyBar')).not_to_be_visible();expect(page.locator('#saveBtn')).to_be_enabled();assert snapshot()==before
  ok('keyboard history view locks edits and returns without changing current stock/draft')
  page.locator('#note').fill('Unsaved input');page.locator('#clearBtn').click();expect(page.locator('#toast')).to_contain_text('Add the current item');assert snapshot()==before;page.locator('#note').fill('')
  page.locator('#actualCash').fill('-1');page.locator('#clearBtn').click();expect(page.locator('#toast')).to_contain_text('Correct the actual cash');assert get('dsb_draft_v2')['tx']==before['dsb_draft_v2']['tx']
  page.locator('#actualCash').fill('650');page.locator('#sumView [data-v="pos"]').click();page.locator('#actualPosCash').fill('480');page.locator('#actualPosElectronic').fill('690');page.locator('#sumView [data-v="retail"]').click();settled()
  fail_put("store==='draft' && value.tx?.length===0 && value.fields?.date==='2026-11-10'")
  page.locator('#clearBtn').click();expect(page.locator('#toast')).to_contain_text('New day not started: Day fixture write fault');settled();assert page.evaluate('__dayFaults')==2, (page.evaluate('__dayFaults'),page.locator('#toast').inner_text())
  assert page.locator('#date').input_value()==day and get('dsb_draft_v2')['tx']==first['tx'];assert get('dsb_stock_v2')==before['dsb_stock_v2']
  assert len(get('dsb_saved_v2'))==1 and get('dsb_saved_v2')[0]['fields']['actualCash']=='650'
  ok('new-day input/count guards; second-phase failure keeps prior draft active and saved snapshot durable')
  page.locator('#clearBtn').evaluate('(b)=>{b.click();b.click()}');expect(page.locator('#toast')).to_contain_text('New day ready');settled()
  draft=get('dsb_draft_v2');assert draft['tx']==[] and draft['fields']['date']=='2026-11-10'
  for key,value in [('openingCash','650.00'),('posOpeningCash','480.00'),('posOpeningElectronic','690.00'),('openingDebt','50.00')]:assert draft['fields'][key]==value
  for key in ['actualCash','actualBankMovement','actualPosCash','actualPosElectronic']:assert draft['fields'][key]==''
  assert draft['openingStock'][pid]['qty']==10 and len(get('dsb_saved_v2'))==1 and get('dsb_stock_v2')==before['dsb_stock_v2']
  ok('retry starts exactly one next day and carries counted balances, debt and stock')
  page.locator('#type').select_option('purchase_credit');page.locator('#note').fill('History Product');page.locator('[data-product-suggest]').click();page.locator('#qty').fill('1');page.locator('#amount').fill('200');page.locator('#party').fill('History supplier');page.locator('#addBtn').click();page.wait_for_function('RoseachyStore.getObject("dsb_draft_v2").tx.length===1');settled();save()
  history();second=get('dsb_saved_v2')[0];assert second['date']=='2026-11-10';count=len(get('dsb_saved_v2'));page.locator(f'#savedList [data-remove-id="{second["id"]}"]').click();expect(page.locator('#toast')).to_contain_text('debt history');assert len(get('dsb_saved_v2'))==count
  # History must show the closed snapshot even after live stock changes on the next day.
  before=snapshot();page.locator(f'#savedList [data-load-id="{day_id}"]').first.click();expect(page.locator('#mCash')).to_have_text('₦700.00');page.locator('#tabBtnStock').click();expect(page.locator('#stockTable')).to_contain_text('History Product');expect(page.locator(f'#stockTable [data-stock-row="{pid}"] .qtyMain')).to_have_text('10 units');expect(page.locator('#stockTable [data-sedit]')).to_have_count(0);assert snapshot()==before
  page.locator('#tabBtnTx').click();page.locator('#backCurrentBtn').click();expect(page.locator('#mCash')).to_have_text('₦650.00');assert snapshot()==before
  ok('debt-containing saved days cannot be deleted; old-day viewing preserves newer stock and active draft')
  # Deletion is the original explicitly confirmed action, on synthetic non-debt history only.
  history();page.locator(f'#savedList [data-remove-id="{day_id}"]').click();settled();assert len(get('dsb_saved_v2'))==1 and get('dsb_stock_v2')==before['dsb_stock_v2']
  state=snapshot();page.reload(wait_until='networkidle');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined');after=snapshot();(OUT/f'{label}-before-reload.json').write_text(json.dumps(state,indent=2));(OUT/f'{label}-after-reload.json').write_text(json.dumps(after,indent=2))
  # Original schema-v8 load adds the derived businessKey index field.
  expected=json.loads(json.dumps(state))
  for record in expected['dsb_saved_v2']:record['businessKey']=record.get('business','').strip().lower()
  assert after==expected;state=after;assert page.evaluate('RoseachyStore.verify()')['ok'];assert not errors,errors
  if label=='react':assert page.evaluate('(()=>{const ids=[...document.querySelectorAll("[id]")].map(x=>x.id);return ids.length===new Set(ids).size})()')
  ok('confirmed non-debt snapshot deletion leaves inventory intact; reload durability and database verify')
  # Reload restores working-form inputs in the original; clear them through UI.
  for key in ['note','amount','qty']:page.locator('#'+key).fill('')
  page.locator('#clearBtn').click();expect(page.locator('#toast')).to_contain_text('New day ready');settled()
  state=snapshot();assert state['dsb_draft_v2']['fields']['date']=='2026-11-11' and state['dsb_draft_v2']['tx']==[]
  for key,value in [('openingCash','650.00'),('posOpeningCash','480.00'),('posOpeningElectronic','690.00'),('openingDebt','50.00')]:assert state['dsb_draft_v2']['fields'][key]==value
  assert state['dsb_draft_v2']['openingStock'][pid]['qty']==11 and len(state['dsb_saved_v2'])==1
  ok('blank counted fields carry expected balances and updated stock to the following day')
  history();page.screenshot(path=str(OUT/f'{label}-days.png'),full_page=False)
  # Older history fixtures exercise pagination through the same public storage API;
  # the financial parity snapshot above remains the actual UI-created records.
  page.evaluate('''async()=>{const records=RoseachyStore.getObject('dsb_saved_v2');for(let i=0;i<35;i++){const date=new Date(Date.UTC(2026,9,1+i)).toISOString().slice(0,10);records.push({id:'pagination-'+i,business:'Pagination fixture',date,fields:{openingCash:i},tx:[],openingStock:{},closingStock:{},archived:i>=33,savedAt:'2026-11-01T12:00:00.000Z',fixtureMetadata:{preserved:true}})}RoseachyStore.setCollection('dsb_saved_v2',records);await RoseachyStore.whenSaved()}''')
  page.reload(wait_until='networkidle');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined');history()
  expect(page.locator('#savedCount')).to_have_text('34 saved days');expect(page.locator('#savedList .rsSavedRow')).to_have_count(30)
  page.locator('#savedList [data-saved-more]').click();expect(page.locator('#savedList .rsSavedRow')).to_have_count(34);expect(page.locator('#savedList [data-saved-more]')).to_have_count(0)
  page.locator('#savedRangeFilter [data-saved-range="archived"]').click();expect(page.locator('#savedList .rsSavedRow')).to_have_count(2)
  page.locator('#savedRangeFilter [data-saved-range="recent"]').click();expect(page.locator('#savedList .rsSavedRow')).to_have_count(30)
  preserved=snapshot();page.locator('#savedList [data-load-id]').first.focus();page.keyboard.press('Space');expect(page.locator('#historyBar')).to_be_visible();page.locator('#backCurrentBtn').click();assert snapshot()==preserved
  assert all(r['fixtureMetadata']['preserved'] for r in get('dsb_saved_v2') if r['id'].startswith('pagination-'));assert not errors,errors
  ok('35 older records paginate, filter/reset and open with Space without changing custom metadata')
  ids={}
  def collect(v):
   if isinstance(v,dict):
    for k,x in v.items():
     if (k=='id' or k.endswith('Id')) and isinstance(x,str):ids.setdefault(x,f'id-{len(ids)}')
     collect(x)
   elif isinstance(v,list):
    for x in v:collect(x)
  collect(state)
  def normalize(v,key=''):
   if isinstance(v,dict):return {ids.get(k,k):normalize(x,k) for k,x in v.items()}
   if isinstance(v,list):return [normalize(x) for x in v]
   if isinstance(v,str):
    if key=='dayFingerprint':return normalize(json.loads(v))
    if key in ['ts','savedAt','createdAt','editedAt','updatedAt']:return '<time>'
    return ids.get(v,v)
   return v
  result=normalize(state);(OUT/f'{label}-normalized.json').write_text(json.dumps(result,indent=2));(OUT/f'{label}-results.json').write_text(json.dumps({'passed':len(checks),'checks':checks},indent=2));context.tracing.stop();return result
 except Exception:
  page.screenshot(path=str(OUT/f'{label}-failure.png'),full_page=True);context.tracing.stop(path=str(OUT/f'{label}-failure.zip'));raise
 finally:context.close();server.shutdown();server.server_close()

archive=ROOT/'reference/original-2.17.2.zip';assert hashlib.sha256(archive.read_bytes()).hexdigest()=='55a9a1ba418c910d2065240bffe4a385a449f285f8e973cd335e9722be9e1a04'
with TemporaryDirectory() as temp,sync_playwright() as pw:
 with zipfile.ZipFile(archive) as z:z.extractall(temp)
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  original=fixture(browser,Path(temp),'original')
  if '--original-only' not in sys.argv:
   react=fixture(browser,ROOT/'dist','react');assert original==react,'Day parity differs; inspect normalized records'
   print('PASS all normalized saved-day, active draft and stock fields match original',flush=True)
 finally:browser.close()
