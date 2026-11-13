"""Real-IDB day failure characterization; original defects are explicitly recorded."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from tempfile import TemporaryDirectory
from datetime import datetime
import json, zipfile, hashlib, sys
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
WIDTH=390 if '--mobile' in sys.argv else 1280
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def fixture(browser,root,label):
    out=ROOT/'tests/evidence'/f'day-recovery-{WIDTH}';out.mkdir(parents=True,exist_ok=True)
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
    Thread(target=server.serve_forever,daemon=True).start()
    context=browser.new_context(service_workers='block',timezone_id='Africa/Lagos',viewport={'width':WIDTH,'height':900})
    context.tracing.start(screenshots=True,snapshots=True)
    page=context.new_page();errors=[];checks=[];defects=[]
    page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
    def ok(name):checks.append(name);print('PASS',label,WIDTH,name,flush=True)
    def get(key):return page.evaluate('(key)=>RoseachyStore.getObject(key)',key)
    def settled():page.evaluate('RoseachyStore.whenSaved()')
    def snapshot():return {k:get(k) for k in ['dsb_saved_v2','dsb_draft_v2','dsb_stock_v2']}
    def disk_saved(store='savedDayRecords'):return page.evaluate('''async(store)=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('roseachy_pwa_db',8);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});try{return await new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}finally{db.close()}}''',store)
    def history():
        t=page.locator('[data-target="dataHistoryBody"]')
        if t.get_attribute('aria-expanded')!='true':t.click()
    def trigger_midnight():page.evaluate('document.dispatchEvent(new Event("visibilitychange"))')
    def fail_saved(method):
        page.evaluate('''method=>{const prior=IDBObjectStore.prototype[method];window.__faults=0;window.__restoreFault=()=>{IDBObjectStore.prototype[method]=prior};IDBObjectStore.prototype[method]=function(...args){if(this.name==='savedDayRecords'){window.__faults++;throw new DOMException('History fixture quota fault','QuotaExceededError')}return prior.apply(this,args)}}''',method)
    try:
        page.clock.set_fixed_time(datetime.fromisoformat('2026-10-31T22:59:50+00:00'))
        page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
        page.locator('#openingCash').fill('100')
        page.locator('#tabBtnStock').click();page.locator('[data-target="stockEntryBody"]').click();page.locator('#stockDivision').select_option('essentials')
        for key,value in [('stockName','Recovery Product'),('stockQty','12'),('stockCost','200'),('stockPrice','300')]:page.locator('#'+key).fill(value)
        page.locator('#stockAddBtn').click();expect(page.locator('#stockTable')).to_contain_text('Recovery Product');settled()
        page.locator('#tabBtnTx').click();page.locator('#note').fill('Recovery Product');page.locator('[data-product-suggest]').click();page.locator('#qty').fill('2');page.locator('#custPaid').fill('600');page.locator('#addBtn').click();expect(page.locator('#mCash')).to_have_text('₦700.00');settled()
        page.locator('#note').fill('Unsubmitted item');settled();before=snapshot()
        page.clock.set_fixed_time(datetime.fromisoformat('2026-10-31T23:00:10+00:00'));trigger_midnight();settled()
        assert snapshot()==before;expect(page.locator('#note')).to_have_value('Unsubmitted item')
        ok('Nigeria midnight skips unfinished entry without changing active records')
        page.locator('#note').fill('');settled();before=snapshot();fail_saved('put');trigger_midnight()
        expect(page.locator('#toast')).to_contain_text('Automatic day save failed');assert page.evaluate('__faults')==2
        assert snapshot()==before and disk_saved()==[]
        page.evaluate('__restoreFault()');trigger_midnight();expect(page.locator('#toast')).to_contain_text('automatically preserved');settled()
        after=snapshot();assert len(after['dsb_saved_v2'])==1 and after['dsb_draft_v2']==before['dsb_draft_v2'] and after['dsb_stock_v2']==before['dsb_stock_v2']
        expect(page.locator('#date')).to_have_value('2026-10-31');trigger_midnight();settled();assert snapshot()==after
        ok('automatic save failure rolls back; visibility retry preserves past day once without advancing the draft')
        history();page.locator('#savedList [data-load-id]').first.click();expect(page.locator('#historyBar')).to_be_visible()
        historical=snapshot();trigger_midnight();settled();assert snapshot()==historical
        page.locator('#backCurrentBtn').click();expect(page.locator('#historyBar')).not_to_be_visible()
        ok('passive preservation does not mutate historical view')
        # Fault only one real persisted read after the next-day draft has committed.
        page.evaluate('''()=>{const get=IDBObjectStore.prototype.get;window.__verificationFaults=0;window.__committedNext=null;
          IDBObjectStore.prototype.get=function(...args){const r=get.apply(this,args);if(this.name==='draft')r.addEventListener('success',()=>{const v=r.result;if(!window.__verificationFaults&&v?.fields?.date==='2026-11-01'){window.__committedNext=structuredClone(v);window.__verificationFaults++;Object.defineProperty(r,'result',{value:{...v,fields:{...v.fields,date:'2099-01-01'}}});IDBObjectStore.prototype.get=get}});return r}}''')
        before=snapshot();page.locator('#clearBtn').click();expect(page.locator('#toast')).to_contain_text('Next-day data could not be verified');settled()
        assert page.evaluate('__verificationFaults')==1 and page.evaluate('__committedNext.fields.date')=='2026-11-01'
        assert get('dsb_draft_v2')==before['dsb_draft_v2'] and get('dsb_stock_v2')==before['dsb_stock_v2']
        expect(page.locator('#date')).to_have_value('2026-10-31');assert page.evaluate('RoseachyStore.verify()')['ok']
        page.locator('#clearBtn').evaluate('(b)=>{b.click();b.click()}');expect(page.locator('#toast')).to_contain_text('New day ready');settled()
        expect(page.locator('#date')).to_have_value('2026-11-01');assert len(get('dsb_saved_v2'))==1 and get('dsb_draft_v2')['tx']==[]
        ok('verification failure after a committed next draft restores the prior draft; duplicate retry advances once')
        history();day_id=get('dsb_saved_v2')[0]['id']
        for action,method,archived in [('archive','put',False),('restore','put',True),('delete','delete',False)]:
            mode='archived' if archived else 'recent'
            page.locator(f'#savedRangeFilter [data-saved-range="{mode}"]').click()
            attr='data-remove-id' if action=='delete' else 'data-archive-id'
            selector=f'#savedList [{attr}="{day_id}"]'
            before=snapshot();disk_before=disk_saved();index_before=disk_saved('transactionRecords');fail_saved(method)
            page.locator(selector).click();page.wait_for_function('__faults>=2')
            if label=='original':
                assert disk_saved()==disk_before and disk_saved('transactionRecords')==index_before and get('dsb_saved_v2')!=before['dsb_saved_v2']
                expect(page.locator('#savedCount')).to_have_text('0 saved days')
                defects.append(action+': UI/working history changed before durable commit')
                print('KNOWN ORIGINAL DEFECT',WIDTH,defects[-1],flush=True)
                page.evaluate('__restoreFault()');settled()
            else:
                expect(page.locator('#toast')).to_contain_text('Saved-day change not saved')
                assert snapshot()==before and disk_saved()==disk_before and disk_saved('transactionRecords')==index_before
                expect(page.locator('#savedCount')).to_have_text('1 saved day')
                page.evaluate('__restoreFault()')
                page.locator(selector).evaluate('(b)=>{b.click();b.click()}');settled()
                page.wait_for_function('!document.querySelector(".app").inert')
                expect(page.locator('#savedCount')).to_have_text('0 saved days')
            assert get('dsb_stock_v2')==before['dsb_stock_v2'] and get('dsb_draft_v2')==before['dsb_draft_v2']
            indexed=disk_saved('transactionRecords');assert (indexed==[] if action=='delete' else len(indexed)==1 and indexed[0]['archived']==(action=='archive'))
            records=get('dsb_saved_v2');assert (records==[] if action=='delete' else len(records)==1 and records[0]['archived']==(action=='archive'))
            assert page.evaluate('RoseachyStore.verify()')['ok']
            ok(action+' retry commits the intended history change without changing live draft or stock')
        page.reload(wait_until='networkidle');page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
        assert get('dsb_saved_v2')==[] and get('dsb_draft_v2')['fields']['date']=='2026-11-01' and get('dsb_stock_v2')[0]['qty']==10
        assert not errors,errors;ok('reload preserves committed next day, stock and history deletion')
        # A second fault prevents restoration after the next draft committed.
        # The visible old date must not remain writable over the persisted next date.
        page.evaluate('''()=>{const get=IDBObjectStore.prototype.get,put=IDBObjectStore.prototype.put;window.__verificationFaults=0;window.__recoveryFaults=0;
          IDBObjectStore.prototype.get=function(...args){const r=get.apply(this,args);if(this.name==='draft')r.addEventListener('success',()=>{const v=r.result;if(!window.__verificationFaults&&v?.fields?.date==='2026-11-02'){window.__verificationFaults++;Object.defineProperty(r,'result',{value:{...v,fields:{...v.fields,date:'2099-01-01'}}});IDBObjectStore.prototype.get=get}});return r};
          IDBObjectStore.prototype.put=function(...args){if(this.name==='draft'&&window.__verificationFaults&&args[0]?.fields?.date==='2026-11-01'&&window.__recoveryFaults<2){window.__recoveryFaults++;if(window.__recoveryFaults===2)IDBObjectStore.prototype.put=put;throw new DOMException('Recovery write fault','QuotaExceededError')}return put.apply(this,args)}
        }''')
        page.locator('#clearBtn').click();expect(page.locator('#toast')).to_contain_text('Day transition needs attention')
        assert page.evaluate('__verificationFaults')==1 and page.evaluate('__recoveryFaults')==2
        expect(page.locator('#date')).to_have_value('2026-11-01')
        recovery_date_before_reload=get('dsb_draft_v2')['fields']['date']
        if label=='original':
            assert recovery_date_before_reload in ['2026-11-01','2026-11-02']
            assert not page.locator('.app').evaluate('(el)=>el.inert')
            defects.append('failed transition recovery leaves old UI writable over committed next-day draft')
            print('KNOWN ORIGINAL DEFECT',WIDTH,defects[-1],flush=True)
            page.reload(wait_until='networkidle')
        else:
            assert recovery_date_before_reload=='2026-11-02'
            expect(page.locator('#dayRecoveryOverlay')).to_be_visible()
            assert page.locator('.app').evaluate('(el)=>el.inert')
            expect(page.locator('#clearBtn')).to_be_disabled()
            page.keyboard.press('Tab');expect(page.locator('#dayRecoveryReload')).to_be_focused()
            # The prior click's 450 ms working-form autosave must not overwrite the committed next day.
            page.wait_for_timeout(600);assert get('dsb_draft_v2')['fields']['date']=='2026-11-02'
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
            page.screenshot(path=str(out/'react-recovery-notice.png'),full_page=True)
            with page.expect_navigation(wait_until='networkidle'):page.locator('#dayRecoveryReload').click()
        page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
        recovered_date=get('dsb_draft_v2')['fields']['date']
        if label=='original':
            assert recovered_date in ['2026-11-01','2026-11-02']
            if recovered_date=='2026-11-01':
                defects.append('queued working-form autosave restored the stale old day during failed recovery')
                print('KNOWN ORIGINAL DEFECT',WIDTH,defects[-1],flush=True)
        else:assert recovered_date=='2026-11-02'
        expect(page.locator('#date')).to_have_value(recovered_date)
        assert get('dsb_stock_v2')[0]['qty']==10 and get('dsb_saved_v2')[0]['date']=='2026-11-01'
        assert page.evaluate('RoseachyStore.verify()')['ok'];assert not errors,errors
        ok('reload reads authoritative draft and retains prior snapshot after failed verification and rollback')
        result={'checks':checks,'knownOriginalDefects':defects,'recoveryDateBeforeReload':recovery_date_before_reload,'recoveryReloadDate':recovered_date,'errors':errors}
        (out/f'{label}-results.json').write_text(json.dumps(result,indent=2));context.tracing.stop();return result
    except Exception:
        page.screenshot(path=str(out/f'{label}-failure.png'),full_page=True);context.tracing.stop(path=str(out/f'{label}-failure.zip'));raise
    finally:context.close();server.shutdown();server.server_close()

archive=ROOT/'reference/original-2.17.2.zip'
assert hashlib.sha256(archive.read_bytes()).hexdigest()=='55a9a1ba418c910d2065240bffe4a385a449f285f8e973cd335e9722be9e1a04'
with TemporaryDirectory() as temp,sync_playwright() as pw:
    with zipfile.ZipFile(archive) as z:z.extractall(temp)
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        fixture(browser,Path(temp),'original')
        if '--original-only' not in sys.argv:fixture(browser,ROOT/'dist','react')
    finally:browser.close()
