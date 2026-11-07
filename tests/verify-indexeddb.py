#!/usr/bin/env python3
"""Test the original Phase 3A IndexedDB module on a disposable loopback origin.

Usage: python tests/verify-indexeddb.py
Requires Python Playwright and Chromium. No real business data is used or touched.
This does NOT exercise React or assert a production deployment is safe.
"""
import asyncio
import json
import socket
import subprocess
import sys
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
CHROMIUM = '/usr/bin/chromium' if Path('/usr/bin/chromium').is_file() else None


def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


async def main():
    port = free_port()
    server = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1', '--directory', str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    url = f'http://127.0.0.1:{port}/tests/fixtures/indexeddb-stage3.html'
    results = []
    try:
        await asyncio.sleep(0.35)
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(executable_path=CHROMIUM, headless=True, args=['--no-sandbox'])
            context = await browser.new_context()
            page = await context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            await page.goto(url, wait_until='load')
            initial = await page.evaluate('''async () => {
                const status = await RoseachyStore.load();
                const finalized = await RoseachyStore.finalizeMigration();
                const product = {id:'validation-item',name:'TEST ONLY / Not real inventory',qty:12,price:300,division:'Essentials'};
                const day = {id:'validation-day',date:'2026-11-01',business:'Test business',tx:[
                  {id:'validation-transaction',type:'pos_cash',productId:'validation-item',amount:600,qty:2,ts:'2026-11-01T00:00:00.000Z'}]};
                RoseachyStore.setCollection('dsb_stock_v2',[product]);
                RoseachyStore.setCollection('dsb_saved_v2',[day]);
                await RoseachyStore.whenSaved();
                const verified = await RoseachyStore.verify();
                return {status:RoseachyStore.status(),finalized,verified};
            }''')
            def record(label, ok, actual=None):
                results.append({'test':label,'pass':bool(ok),'details':actual})
            record('IndexedDB v8 selected rather than localStorage fallback', initial['status']['mode']=='indexeddb' and initial['status']['dbVersion']==8,initial['status'])
            record('Fresh migration completed', initial['finalized']['ok'] and initial['finalized']['info']['status']=='complete',initial['finalized'])
            record('Stock and saved day committed and storage verification succeeds', initial['verified']['ok'] and initial['status']['pending']==0,initial['verified'])
            await page.reload(wait_until='load')
            reloaded = await page.evaluate('''async () => {
                await RoseachyStore.load();
                const stock=RoseachyStore.getObject('dsb_stock_v2');
                const days=RoseachyStore.getObject('dsb_saved_v2');
                const db = await new Promise((resolve,reject)=>{const r=indexedDB.open('roseachy_pwa_db',8);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
                const names=[...db.objectStoreNames];
                const t=db.transaction('transactionRecords','readonly');
                const tx=await new Promise((resolve,reject)=>{const r=t.objectStore('transactionRecords').get('validation-transaction');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
                db.close();
                return {stock,days,tx,names,status:RoseachyStore.status()};
            }''')
            record('Stock records persisted across a full browser reload',len(reloaded['stock'])==1 and reloaded['stock'][0]['qty']==12,{'stock':reloaded['stock']})
            record('Saved day and embedded transaction persisted after reload', len(reloaded['days'])==1 and len(reloaded['days'][0].get('tx',[]))==1,{'days':reloaded['days']})
            record('Transaction index store is populated', bool(reloaded['tx']) and reloaded['tx'].get('productId')=='validation-item',{'tx':reloaded['tx']})
            record('Expected IDB object stores created',all(name in reloaded['names'] for name in ('stockRecords','savedDayRecords','transactionRecords','metadata','syncEventRecords')),{'stores':reloaded['names']})
            another = await context.new_page()
            await another.goto(url,wait_until='load')
            await another.evaluate('RoseachyStore.load()')
            await page.evaluate('''async () => { RoseachyStore.setCollection('dsb_stock_v2', [{id:'validation-item',name:'TEST ONLY / Not real inventory',qty:10,price:300,division:'Essentials'}]); await RoseachyStore.whenSaved(); }''')
            await another.wait_for_timeout(400)
            blocked = await another.evaluate('''async () => {
                const stale=RoseachyStore.status().stale;
                try {RoseachyStore.setCollection('dsb_stock_v2',[{id:'unsafe-write',name:'should not write',qty:2}]);await RoseachyStore.whenSaved();return {stale,blocked:false};}
                catch(e){return {stale,blocked:e.name==='StaleWindowError',message:String(e.message)};}
            }''')
            record('Concurrent stale tab cannot write outdated stock',blocked['stale'] and blocked['blocked'],blocked)
            await another.close()
            await page.reload(wait_until='load')
            final=await page.evaluate('''async () => {
              await RoseachyStore.load();
              return {stock:RoseachyStore.getObject('dsb_stock_v2'),verification:await RoseachyStore.verify()};
            }''')
            record('Fresh reload reads safely updated stock quantity',len(final['stock'])==1 and final['stock'][0]['qty']==10 and final['verification']['ok'],final)
            record('No uncaught browser errors',not errors,errors)
            await context.close()
            # Test localStorage-to-IndexedDB migration using a second isolated browser context
            legacy_context=await browser.new_context()
            legacy_page=await legacy_context.new_page()
            await legacy_page.goto(url,wait_until='load')
            legacy=await legacy_page.evaluate('''async () => {
              localStorage.setItem('dsb_stock_v2',JSON.stringify([{id:'migrated-test',name:'Legacy test item',qty:7}]));
              const initial=await RoseachyStore.load();
              const finalized=await RoseachyStore.finalizeMigration();
              await RoseachyStore.whenSaved();
              return {status:RoseachyStore.status(),stock:RoseachyStore.getObject('dsb_stock_v2'),finalized};
            }''')
            record('Legacy localStorage collection migrates into IndexedDB', legacy['status']['mode']=='indexeddb' and legacy['finalized']['ok'] and len(legacy['stock'])==1 and legacy['stock'][0]['qty']==7,legacy)
            await legacy_page.reload(wait_until='load')
            migrated=await legacy_page.evaluate('''async () => {await RoseachyStore.load();return {stock:RoseachyStore.getObject('dsb_stock_v2'),status:RoseachyStore.status()};}''')
            record('Migrated legacy stock persists after reload',len(migrated['stock'])==1 and migrated['stock'][0]['id']=='migrated-test',migrated)
            await legacy_context.close()
            await browser.close()
    finally:
        server.terminate()
        try: server.wait(timeout=5)
        except subprocess.TimeoutExpired: server.kill()
    print(json.dumps({'passed':sum(x['pass'] for x in results),'total':len(results),'results':results},indent=2))
    return 0 if all(x['pass'] for x in results) else 1

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
