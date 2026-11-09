"""Stock form regression on real Chromium + built app, using disposable records."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
import json
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'tests/evidence';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT/'dist')))
Thread(target=server.serve_forever,daemon=True).start()
checks=[]
def ok(name):checks.append(name);print('PASS',name,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(service_workers='block');context.tracing.start(screenshots=True,snapshots=True)
 page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 def saved():page.evaluate('RoseachyStore.whenSaved()');page.wait_for_function('!document.querySelector("#stockAddBtn").disabled')
 def stock():return page.evaluate('RoseachyStore.getObject("dsb_stock_v2")')
 try:
  page.goto(f'http://127.0.0.1:{server.server_port}');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
  page.locator('#tabBtnStock').click();page.locator('[data-target="stockEntryBody"]').click()
  assert page.locator('[data-react-stock-field]').count()>=20
  page.locator('#stockAddBtn').click();saved();assert not stock();ok('empty-name rejection leaves inventory empty')
  page.locator('#stockName').fill('Form Test Product');page.locator('#stockDivision').select_option('essentials')
  page.locator('#stockQty').fill('12');page.locator('#stockCost').fill('200');page.locator('#stockPrice').fill('300')
  page.locator('#stockAddBtn').evaluate('(button)=>{button.click();button.click()}');saved()
  assert len(stock())==1 and stock()[0]['qty']==12
  expect(page.locator('#stockName')).to_have_value('');ok('duplicate submit creates exactly one product; successful save clears draft')
  product=stock()[0];pid=product['id']
  page.locator('[data-sedit]').click();saved()
  expect(page.locator('#stockName')).to_have_value('Form Test Product')
  expect(page.locator('#stockQty')).to_be_disabled()
  page.locator('#stockName').fill('Cancelled rename');page.locator('#stockCancelBtn').click();saved()
  assert stock()[0]['name']=='Form Test Product';ok('edit hydration and cancel preserve record and quantity lock')
  page.locator('[data-sedit]').click();saved()
  page.locator('#stockName').fill('Renamed Product');page.locator('#stockPrice').fill('350')
  page.locator('#stockAddBtn').click();saved()
  assert stock()[0]['id']==pid and stock()[0]['qty']==12 and stock()[0]['price']==350
  assert stock()[0]['name']=='Renamed Product';ok('edit preserves identity and quantity while saving name and price')
  # Test draft hydration after the existing working-forms persistence path.
  page.locator('#stockName').fill('Unfinished Draft');page.locator('#stockQty').fill('7')
  page.locator('#tabBtnTx').click();page.locator('#tabBtnStock').click()
  expect(page.locator('#stockName')).to_have_value('Unfinished Draft');expect(page.locator('#stockQty')).to_have_value('7')
  ok('tab switching preserves controlled draft')
  page.locator('#stockName').fill('Packed Product');page.locator('#stockDivision').select_option('essentials')
  page.locator('#stockPackEnabled').check();page.locator('#stockUnitsPerPack').fill('6');page.locator('#stockPacks').fill('2');page.locator('#stockLooseUnits').fill('1')
  expect(page.locator('#stockQty')).to_have_value('13')
  page.locator('#stockCost').fill('100');page.locator('#stockPrice').fill('150')
  page.locator('label.qpSwitch:has(#stockQpEnabled)').click();expect(page.locator('#stockQpEnabled')).to_be_checked();page.locator('#stockQpQty').fill('3');page.locator('#stockQpPrice').fill('400')
  page.locator('#stockAddBtn').click();saved()
  packed=next(p for p in stock() if p['name']=='Packed Product')
  assert packed['qty']==13 and packed['unitsPerPack']==6 and packed['sealedPacks']==2 and packed['looseUnits']==1
  assert packed['quantityPricingEnabled'] and packed['quantityPricingPrice']==400
  ok('pack arithmetic, total cost and quantity pricing survive controlled updates')
  # Fail both IndexedDB commit attempts, retaining the real transaction engine.
  before=stock()
  page.locator('#stockName').fill('Write Failure Product');page.locator('#stockDivision').select_option('essentials')
  page.locator('#stockQty').fill('5');page.locator('#stockCost').fill('20');page.locator('#stockPrice').fill('30')
  page.evaluate('''() => { const original=IDBObjectStore.prototype.put; let remaining=2; IDBObjectStore.prototype.put=function(...args){if(this.name==='stockRecords' && remaining-- > 0){if(remaining===0)IDBObjectStore.prototype.put=original;throw new DOMException('Injected disk full','QuotaExceededError')}return original.apply(this,args)}; }''')
  page.locator('#stockAddBtn').click();page.wait_for_function('document.querySelector("#stockAddBtn").getAttribute("aria-busy")==="false"')
  assert stock()==before
  expect(page.locator('#stockName')).to_have_value('Write Failure Product')
  expect(page.locator('#stockQty')).to_have_value('5')
  ok('failed real IndexedDB commit rolls back inventory and preserves form draft')
  page.locator('#stockAddBtn').click();saved();assert len(stock())==len(before)+1
  ok('retry after storage recovery commits once')
  page.reload(wait_until='networkidle');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
  assert len(stock())==3 and next(p for p in stock() if p['id']==pid)['price']==350
  assert page.evaluate('RoseachyStore.verify()')['ok']
  assert not errors,errors
  ok('reload verifies all records with no uncaught browser errors')
  context.tracing.stop()
  (OUT/'stock-form-results.json').write_text(json.dumps({'passed':len(checks),'checks':checks},indent=2))
 except Exception:
  page.screenshot(path=str(OUT/'stock-form-failure.png'),full_page=True)
  context.tracing.stop(path=str(OUT/'stock-form-failure.zip'));raise
 finally:browser.close();server.shutdown();server.server_close()
