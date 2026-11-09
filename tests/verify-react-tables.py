from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
import json
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests/evidence';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT/'dist')));Thread(target=server.serve_forever,daemon=True).start()
checks=[]
def ok(name):checks.append(name);print('PASS',name,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);context=browser.new_context(service_workers='block');page=context.new_page();errors=[]
 context.tracing.start(screenshots=True,snapshots=True)
 page.on('pageerror',lambda e:errors.append(str(e)))
 def dialog(d):
  if d.type!='confirm': errors.append('Unexpected dialog: '+d.message)
  d.accept()
 page.on('dialog',dialog)
 def stock():return page.evaluate('RoseachyStore.getObject("dsb_stock_v2")')
 try:
  page.goto(f'http://127.0.0.1:{server.server_port}');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
  page.locator('#tabBtnStock').click();page.locator('[data-target="stockEntryBody"]').click()
  for name in ['React <b>Literal</b>','Second Product']:
   page.locator('#stockDivision').select_option('essentials')
   for key,value in [('stockName',name),('stockQty','12'),('stockCost','200'),('stockPrice','300')]:page.locator('#'+key).fill(value)
   page.locator('#stockAddBtn').click();expect(page.locator('#stockTable')).to_contain_text(name);page.evaluate('RoseachyStore.whenSaved()')
  assert page.locator('#stockTable b').count()==0;ok('product names render as text, not HTML')
  page.locator('[data-class-view="stock"][data-mode="division"]').click()
  expect(page.locator('[data-class-toggle="d:essentials"]')).to_have_attribute('aria-expanded','true')
  page.locator('[data-class-toggle="d:essentials"]').click();expect(page.locator('[data-class-toggle="d:essentials"]')).to_have_attribute('aria-expanded','false')
  page.locator('[data-class-toggle="d:essentials"]').click();expect(page.locator('#stockTable')).to_contain_text('Second Product')
  ok('React division headings expand and collapse once per click')
  page.locator('[data-class-add-sub="pharmacy"]').click();page.locator('#classificationName').fill('Table Test Subdivision');page.locator('#classificationNameSave').click()
  expect(page.locator('#classificationNameDialog')).not_to_be_visible()
  before=stock()
  row=page.locator('[data-stock-row]').first;cell=row.locator('td').first;cell.scroll_into_view_if_needed();box=cell.bounding_box()
  page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down();page.wait_for_timeout(2100);page.mouse.up()
  expect(page.locator('[data-stock-select]').first).to_be_checked()
  page.locator('#stockSelectAllBtn').click()
  assert page.locator('[data-stock-select]:checked').count()==2
  page.locator('#stockMoveSelectedBtn').click();page.locator('#moveDivision').select_option('pharmacy');page.locator('#moveSubdivision').select_option(label='Table Test Subdivision');page.locator('#classificationMoveConfirm').click()
  expect(page.locator('#classificationMoveDialog')).not_to_be_visible();page.evaluate('RoseachyStore.whenSaved()')
  after=stock()
  for a,b in zip(before,after):
   assert {k:v for k,v in a.items() if k not in ('division','subdivisionId')}=={k:v for k,v in b.items() if k not in ('division','subdivisionId')}
   assert b['division']=='pharmacy' and b['subdivisionId']
  expect(page.locator('#stockTable')).to_contain_text('Table Test Subdivision')
  assert page.locator('[data-stock-select]').count()==0
  ok('long press, Select All and subdivision move preserve every nonclassification field')
  page.locator('#tabBtnTx').click();page.locator('#note').fill('React <b>Literal</b>');page.locator('[data-product-suggest]').click();page.locator('#qty').fill('2');page.locator('#custPaid').fill('600');page.locator('#addBtn').click()
  expect(page.locator('#ledger')).to_contain_text('React <b>Literal</b>');page.evaluate('RoseachyStore.whenSaved()')
  assert page.locator('#ledger b').count()==0
  page.locator('#ledger [data-tog]').click();expect(page.locator('.txDetail')).to_contain_text('React <b>Literal</b>')
  expect(page.locator('.recordMetaGrid')).to_contain_text('Pharmacy')
  page.locator('#ledger [data-tog]').click();assert page.locator('.txDetail').count()==0
  ok('ledger text, metadata and detail toggle use React components')
  page.locator('#ledger [data-del]').click();page.wait_for_function('RoseachyStore.getObject("dsb_draft_v2").tx.length===0');page.evaluate('RoseachyStore.whenSaved()')
  assert stock()[0]['qty']==12
  expect(page.locator('#ledger')).to_contain_text('No matching transactions')
  ok('React delete command reverses the sale once and restores inventory')
  assert not errors,errors;assert page.evaluate('RoseachyStore.verify()')['ok']
  context.tracing.stop();(OUT/'react-table-results.json').write_text(json.dumps({'passed':len(checks),'checks':checks},indent=2))
 except Exception:
  page.screenshot(path=str(OUT/'react-tables-failure.png'),full_page=True);context.tracing.stop(path=str(OUT/'react-tables-failure.zip'));raise
 finally:browser.close();server.shutdown();server.server_close()
