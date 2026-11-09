"""Run the same real UI fixture against immutable original and built React app."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from tempfile import TemporaryDirectory
import json, zipfile, hashlib, sys
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'tests/evidence' / ('baseline-mobile' if '--mobile' in sys.argv else 'baseline-desktop')
VIEWPORT = {'width':390,'height':844} if '--mobile' in sys.argv else {'width':1280,'height':900}
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

def fixture(browser, root, label):
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(root)))
    Thread(target=server.serve_forever, daemon=True).start()
    context = browser.new_context(accept_downloads=True, service_workers='block',viewport=VIEWPORT)
    page = context.new_page()
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    try:
        page.goto(f'http://127.0.0.1:{server.server_port}')
        page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
        page.locator('#tabBtnStock').click()
        page.locator('[data-target="stockEntryBody"]').click()
        page.locator('#stockDivision').select_option('essentials')
        for field,value in [('stockName','Parity Product'),('stockQty','12'),('stockCost','200'),('stockPrice','300')]:
            page.locator('#'+field).fill(value)
        page.locator('#stockAddBtn').click()
        expect(page.locator('#stockTable')).to_contain_text('Parity Product')
        page.evaluate('RoseachyStore.whenSaved()')
        page.locator('#tabBtnTx').click()
        page.locator('#note').fill('Parity Product')
        page.locator('[data-product-suggest]').click()
        page.locator('#qty').fill('2')
        page.locator('#custPaid').fill('600')
        page.locator('#addBtn').click()
        expect(page.locator('#ledger')).to_contain_text('₦600.00')
        page.evaluate('RoseachyStore.whenSaved()')
        if '--financial' in sys.argv: financial_scenario(page)
        state=page.evaluate('({stock:RoseachyStore.getObject("dsb_stock_v2"), draft:RoseachyStore.getObject("dsb_draft_v2"),creditCustomers:RoseachyStore.getObject("roseachy_credit_customers_v1")})')
        assert state['stock'][0]['qty']==(6 if '--credit' in sys.argv else 8 if '--financial' in sys.argv else 10)
        # A real export through the existing download UI, never private test hooks.
        page.locator('#tabBtnStock').click()
        toggle=page.locator('[data-target="stockTransferBody"]')
        if toggle.get_attribute('aria-expanded') != 'true': toggle.click()
        with page.expect_download() as d:
            page.locator('#stockExportJsonBtn').click()
        path=OUT/f'{label}-working-stock.json'; d.value.save_as(path)
        export=json.loads(path.read_text())
        if '--backup' in sys.argv:
            export_full(page,label)
            if label=='react': restore_original_backup(browser,f'http://127.0.0.1:{server.server_port}')
        assert export['stock'][0]['qty']==state['stock'][0]['qty']
        page.reload(wait_until='networkidle')
        page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
        assert page.evaluate('RoseachyStore.getObject("dsb_stock_v2")[0].qty')==state['stock'][0]['qty']
        assert page.evaluate('RoseachyStore.verify()')['ok']
        assert not errors, errors
        # Compare all persisted stock + working transaction fields, ignoring only
        # generated identities/time and their references. Money/quantity untouched.
        ids={}
        def normalize(value, key=''):
            if isinstance(value,dict):
                for k in [k for k in value if k=='id' or k.endswith('Id')]:
                    if isinstance(value.get(k),str): ids.setdefault(value[k], f'id-{len(ids)}')
                return {ids.get(k,k):normalize(v,k) for k,v in value.items()}
            if isinstance(value,list): return [normalize(v) for v in value]
            if isinstance(value,str):
                if key in ('ts','createdAt','editedAt','updatedAt','date'): return '<time>'
                return ids.get(value,value)
            return value
        state['totals']=page.evaluate('Object.fromEntries(["mSales","mNetSales","mReceived","mCash","mBank","mProfit","mCogs","mRefunds","mExpenses","mDebt","mPayable"].map(id=>[id,document.getElementById(id).textContent]))')
        result=normalize(state)
        (OUT/f'{label}-normalized.json').write_text(json.dumps(result,indent=2))
        print('PASS',label,'create, sale, export and reload',flush=True)
        return result
    except Exception:
        page.screenshot(path=str(OUT/f'{label}-failure.png'),full_page=True)
        raise
    finally:
        context.close();server.shutdown();server.server_close()

def export_full(page,label):
    page.locator('#tabBtnTx').click()
    toggle=page.locator('[data-target="dataHistoryBody"]')
    if toggle.get_attribute('aria-expanded')!='true':toggle.click()
    with page.expect_download() as download:page.locator('#backupBtn').click()
    path=OUT/f'{label}-full-backup.json';download.value.save_as(path)
    data=json.loads(path.read_text());assert data['format']=='roseachy-full-backup' and data['integrity']['algorithm']=='SHA-256'
    verified=page.evaluate("""async data=>{const expected=data.integrity.hash;delete data.integrity;const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(data)));return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')===expected}""",data)
    assert verified
    print('PASS',label,'Full Backup exported with verified SHA-256',flush=True)

def restore_original_backup(browser,url):
    context=browser.new_context(accept_downloads=True,service_workers='block',viewport=VIEWPORT)
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('dialog',lambda d:d.accept())
    page.on('download',lambda d:d.save_as(OUT/'restore-safety-backup.json'))
    original=json.loads((OUT/'original-full-backup.json').read_text())
    try:
        page.goto(url);page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
        assert page.evaluate('RoseachyStore.getObject("dsb_stock_v2").length')==0
        page.locator('#importFile').set_input_files(str(OUT/'original-full-backup.json'))
        expect(page.locator('#toast')).to_contain_text('Full Backup restored and verified',timeout=15000)
        assert (OUT/'restore-safety-backup.json').is_file()
        page.reload(wait_until='networkidle');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
        assert page.evaluate('RoseachyStore.getObject("dsb_stock_v2")')==original['stock']
        assert page.evaluate('RoseachyStore.getObject("dsb_draft_v2").tx')==original['draft']['tx']
        assert page.evaluate('RoseachyStore.verify()')['ok']
        changed=json.loads(json.dumps(original));changed['stock'][0]['qty']+=1
        malformed=OUT/'tampered-backup.json';malformed.write_text(json.dumps(changed))
        page.locator('#importFile').set_input_files(str(malformed))
        expect(page.locator('#toast')).to_contain_text('checksum mismatch')
        assert page.evaluate('RoseachyStore.getObject("dsb_stock_v2")')==original['stock']
        assert not errors,errors
        print('PASS original Full Backup → fresh React profile → reload; tampered backup rejected without changes',flush=True)
    except Exception:
        page.screenshot(path=str(OUT/'restore-failure.png'),full_page=True);raise
    finally:context.close()

def credit_scenario(page):
    page.locator('#creditAccountsBtn').click();page.locator('#creditNew').click()
    page.locator('#creditName').fill('Parity Credit Customer');page.locator('#creditConfirm').click()
    expect(page.locator('#creditAddProducts')).to_be_visible()
    page.locator('#creditAddProducts').click()
    page.locator('[data-product-search]').fill('Parity Product');page.locator('[data-credit-product]').click()
    page.locator('[data-quantity]').fill('2');page.locator('#creditPaid').fill('200');page.locator('#creditConfirm').click()
    expect(page.locator('#creditRecordPayment')).to_be_visible()
    expect(page.locator('#creditContent > .creditSummary')).to_contain_text('₦400.00')
    page.evaluate('RoseachyStore.whenSaved()')
    assert page.evaluate('RoseachyStore.getObject("dsb_stock_v2")[0].qty')==6
    page.locator('#creditRecordPayment').click();page.locator('#creditPaymentAmount').fill('100');page.locator('#creditConfirm').click()
    expect(page.locator('#creditRecordPayment')).to_be_visible()
    expect(page.locator('#creditContent > .creditSummary')).to_contain_text('₦300.00')
    page.locator('#creditClose').click();page.evaluate('RoseachyStore.whenSaved()')
    expect(page.locator('#mCash')).to_have_text('₦850.00')
    rows=page.evaluate('RoseachyStore.getObject("dsb_draft_v2").tx')
    assert len(rows)==6 and rows[-2]['type']=='sale_account' and rows[-1]['type']=='credit_payment_cash'
    assert rows[-2]['splitCredit']==400 and rows[-1]['amount']==100
    print('PASS credit account purchase, partial payment, repayment, stock and cash reconciliation',flush=True)

def financial_scenario(page):
    def records(): return page.evaluate('RoseachyStore.getObject("dsb_draft_v2").tx')
    def commit(count):
        page.locator('#addBtn').click()
        page.wait_for_function('(n)=>RoseachyStore.getObject("dsb_draft_v2").tx.length===n',arg=count)
        page.evaluate('RoseachyStore.whenSaved()')
    def select_product():
        page.locator('#note').fill('Parity Product');page.locator('[data-product-suggest]').click()
    tid=records()[0]['id']
    page.locator('#ledger [data-edit]').click();page.evaluate('RoseachyStore.whenSaved()')
    page.locator('#qty').fill('3');page.locator('#custPaid').fill('900');commit(1)
    page.wait_for_function('RoseachyStore.getObject("dsb_stock_v2")[0].qty===9')
    assert records()[0]['id']==tid and records()[0]['amount']==900
    page.locator('#type').select_option('refund_cash');select_product()
    page.locator('#refundSource').select_option(tid);page.locator('#qty').fill('1');page.locator('#refundReturn').check();commit(2)
    assert records()[1]['amount']==300 and records()[1]['originalSaleId']==tid
    page.locator('#type').select_option('sale_transfer');select_product();page.locator('#qty').fill('2');commit(3)
    page.locator('#type').select_option('expense_cash');page.locator('#note').fill('Shop expense');page.locator('#amount').fill('50');commit(4)
    assert records()[3]['amount']==50
    page.locator('#ledger [data-tog]').first.click()
    expect(page.locator('.txDetail')).to_contain_text('Parity Product')
    expect(page.locator('#mNetSales')).to_have_text('₦1,200.00')
    expect(page.locator('#mCash')).to_have_text('₦550.00')
    expect(page.locator('#mBank')).to_have_text('₦600.00')
    expect(page.locator('#mCogs')).to_have_text('₦800.00')
    print('PASS edit, linked refund, transfer sale, expense, details and exact totals',flush=True)
    if '--credit' in sys.argv: credit_scenario(page)

OUT.mkdir(parents=True,exist_ok=True)
archive=ROOT/'reference/original-2.17.2.zip'
assert hashlib.sha256(archive.read_bytes()).hexdigest()=='55a9a1ba418c910d2065240bffe4a385a449f285f8e973cd335e9722be9e1a04'
with TemporaryDirectory() as temp, sync_playwright() as pw:
    with zipfile.ZipFile(archive) as z: z.extractall(temp)
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        original=fixture(browser,Path(temp),'original')
        react=fixture(browser,ROOT/'dist','react')
        assert original==react, 'Persisted stock/draft parity differs; inspect normalized evidence'
        print('PASS all normalized stock and working-day fields match original 2.17.2',flush=True)
    finally: browser.close()
