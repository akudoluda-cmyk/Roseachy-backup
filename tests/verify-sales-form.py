"""Real Sales form interactions: no mocked storage or private controller hooks."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
import json
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests/evidence';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT/'dist')))
Thread(target=server.serve_forever,daemon=True).start()
checks=[]
def ok(name):checks.append(name);print('PASS',name,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);context=browser.new_context(service_workers='block');context.tracing.start(screenshots=True,snapshots=True)
 page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 def stock():return page.evaluate('RoseachyStore.getObject("dsb_stock_v2")')
 def tx():return page.evaluate('(RoseachyStore.getObject("dsb_draft_v2")||{}).tx||[]')
 def saved():page.wait_for_function('document.querySelector("#addBtn").getAttribute("aria-busy")==="false"');page.evaluate('RoseachyStore.whenSaved()')
 def select():page.locator('#note').fill('Sales Test Product');page.locator('[data-product-suggest]').click()
 try:
  page.goto(f'http://127.0.0.1:{server.server_port}');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
  page.locator('#tabBtnStock').click();page.locator('[data-target="stockEntryBody"]').click()
  page.locator('#stockDivision').select_option('essentials')
  for field,value in [('stockName','Sales Test Product'),('stockQty','12'),('stockCost','200'),('stockPrice','300')]:page.locator('#'+field).fill(value)
  page.locator('#stockAddBtn').click();expect(page.locator('#stockTable')).to_contain_text('Sales Test Product');page.evaluate('RoseachyStore.whenSaved()')
  page.locator('#tabBtnTx').click();assert page.locator('[data-react-sales-field]').count()>10
  page.locator('#note').fill('no such product xyz')
  expect(page.locator('#productSuggestions')).to_contain_text('No matching product')
  page.locator('#note').press('Escape');expect(page.locator('#note')).to_have_attribute('aria-expanded','false')
  page.locator('#note').fill('Sales Test')
  page.locator('#note').press('ArrowDown')
  expect(page.locator('#note')).to_have_attribute('aria-activedescendant','product-suggestion-0')
  expect(page.locator('[data-product-suggest]')).to_have_attribute('aria-selected','true')
  page.locator('#note').press('Enter');expect(page.locator('#qty')).to_be_focused()
  expect(page.locator('#note')).to_have_value('Sales Test Product')
  expect(page.locator('#productSuggestions')).not_to_be_visible()
  page.locator('#note').fill('');page.locator('#qty').fill('');page.locator('#amount').fill('')
  ok('React product picker supports empty results, Escape, arrows, Enter and focus transfer')
  page.locator('#addBtn').click();saved();assert not tx();ok('invalid empty sale rejected without a transaction')
  select();page.locator('#qty').fill('13');page.locator('#custPaid').fill('3900');page.locator('#addBtn').click();saved()
  assert not tx() and stock()[0]['qty']==12;ok('overselling rejected without inventory mutation')
  page.locator('#qty').fill('2');page.locator('#custPaid').fill('600')
  page.locator('#addBtn').evaluate('(button)=>{button.click();button.click()}');saved()
  assert len(tx())==1 and tx()[0]['amount']==600 and stock()[0]['qty']==10
  tid=tx()[0]['id'];ok('double submit creates one cash sale and one stock deduction')
  page.locator('#ledger [data-edit]').click();page.evaluate('RoseachyStore.whenSaved()')
  expect(page.locator('#qty')).to_have_value('2');expect(page.locator('#note')).to_have_value('Sales Test Product')
  page.locator('#qty').fill('3');page.locator('#custPaid').fill('900');page.locator('#addBtn').click();saved()
  assert len(tx())==1 and tx()[0]['id']==tid and tx()[0]['amount']==900 and stock()[0]['qty']==9
  ok('editing a sale preserves identity and adjusts stock by the difference')
  page.locator('#ledger [data-edit]').click();page.evaluate('RoseachyStore.whenSaved()')
  page.locator('#qty').fill('4');page.locator('#cancelEditBtn').click();saved()
  assert tx()[0]['qty']==3 and stock()[0]['qty']==9;ok('cancel edit leaves transaction and inventory unchanged')
  page.locator('#type').select_option('refund_cash');select()
  page.locator('#refundSource').select_option(tid);page.locator('#qty').fill('1')
  if not page.locator('#refundReturn').is_checked():page.locator('#refundReturn').check()
  page.locator('#addBtn').click();saved()
  assert len(tx())==2 and tx()[1]['type']=='refund_cash' and tx()[1]['amount']==300 and stock()[0]['qty']==10
  assert tx()[1]['originalSaleId']==tid;ok('linked refund returns one unit and retains original sale reference')
  before=tx();page.locator('#type').select_option('sale_cash');select();page.locator('#qty').fill('1');page.locator('#custPaid').fill('300')
  page.evaluate('''() => {const put=IDBObjectStore.prototype.put;let remaining=2;IDBObjectStore.prototype.put=function(...args){if(this.name==='stockRecords'&&remaining-- > 0){if(!remaining)IDBObjectStore.prototype.put=put;throw new DOMException('Injected failure','QuotaExceededError')}return put.apply(this,args)};}''')
  page.locator('#addBtn').click();page.wait_for_function('document.querySelector("#addBtn").getAttribute("aria-busy")==="false"')
  assert tx()==before and stock()[0]['qty']==10
  expect(page.locator('#note')).to_have_value('Sales Test Product');expect(page.locator('#qty')).to_have_value('1')
  ok('failed sale commit rolls back ledgers and stock, preserving the draft')
  page.locator('#addBtn').click();saved();assert len(tx())==3 and stock()[0]['qty']==9
  page.reload(wait_until='networkidle');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
  assert len(tx())==3 and stock()[0]['qty']==9 and page.evaluate('RoseachyStore.verify()')['ok']
  assert page.evaluate('RoseachyRepository.getSnapshot("dsb_stock_v2")[0].qty')==9
  assert not errors,errors;ok('retry and reload preserve reconciled transactions and inventory')
  context.tracing.stop();(OUT/'sales-form-results.json').write_text(json.dumps({'passed':len(checks),'checks':checks},indent=2))
 except Exception:
  page.screenshot(path=str(OUT/'sales-form-failure.png'),full_page=True);context.tracing.stop(path=str(OUT/'sales-form-failure.zip'));raise
 finally:browser.close();server.shutdown();server.server_close()
