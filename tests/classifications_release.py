"""Unmodified production page and service worker, no private test exports."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',8046),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto('http://127.0.0.1:8046',wait_until='networkidle');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined');page.evaluate('navigator.serviceWorker.ready');page.locator('#tabBtnStock').tap();page.locator('#stockClassificationToolbar [data-class-add-division]').tap();page.locator('#classificationName').fill('Offline Division');page.locator('#classificationNameSave').tap();page.wait_for_function('!document.querySelector("#classificationNameDialog").open');page.locator('[data-class-view="stock"][data-mode="division"]').tap();page.locator('[data-class-add-sub]').last.tap();page.locator('#classificationName').fill('Offline Subdivision');page.locator('#classificationNameSave').tap();page.wait_for_function('!document.querySelector("#classificationNameDialog").open');page.locator('[data-target="stockEntryBody"]').tap();page.locator('#stockName').fill('Offline Product');page.locator('#stockDivision').select_option(label='Offline Division');page.locator('#stockSubdivision').select_option(label='Offline Subdivision');page.locator('#stockQty').fill('5');page.locator('#stockCost').fill('100');page.locator('#stockPrice').fill('150');page.locator('#stockAddBtn').tap();page.wait_for_function('document.querySelector("#stockTable").textContent.includes("Offline Product")');page.evaluate('RoseachyStore.whenSaved()');page.reload(wait_until='networkidle');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined');assert page.evaluate('!!navigator.serviceWorker.controller');context.set_offline(True);page.reload(wait_until='networkidle');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined');page.locator('#tabBtnStock').tap();assert page.locator('[data-class-view="stock"][data-mode="division"]').get_attribute('aria-pressed')=='true';assert 'Offline Product' in page.locator('#stockTable').inner_text();assert 'Offline Subdivision' in page.locator('#stockTable').inner_text();assert page.evaluate('RoseachyStore.verify()')['ok'];assert not errors,errors;Path('/tmp/classification-release-results.json').write_text(json.dumps({'unmodifiedProduction':True,'touchProductCreation':True,'serviceWorkerControlled':True,'offlineReload':True,'classificationPersistence':True,'databaseVerified':True,'browserErrors':errors},indent=2));print('PASS unmodified production, touch creation, service worker, offline reload and database verification',flush=True)
 finally:browser.close();server.shutdown()
