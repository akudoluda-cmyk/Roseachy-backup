"""Repository boundary against the unchanged real schema-v8 IndexedDB service."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'tests/evidence'; OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
checks=[]
def ok(name): checks.append(name); print('PASS',name,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(service_workers='block');page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 url=f'http://127.0.0.1:{server.server_port}/tests/'
 def boot(p):
  p.goto(url)
  p.add_script_tag(url=f'http://127.0.0.1:{server.server_port}/public/legacy/01-storage.js')
  p.evaluate('''async()=>{
   const {createDeskRepository}=await import('/src/data/desk-repository.mjs');
   window.repo=createDeskRepository(RoseachyStore,window);window.service=repo.controller;
   await service.load();await repo.settled();
  }''')
 try:
  boot(page)
  assert page.evaluate('service.status().mode')=='indexeddb'
  assert page.evaluate('service.status().dbVersion')==8
  assert page.evaluate('service.setCommitObserver===RoseachyStore.setCommitObserver')
  ok('real IndexedDB v8 and original sync commit-observer ownership')
  result=page.evaluate('''async()=>{
   window.seen=[];repo.subscribe('dsb_stock_v2',()=>seen.push(repo.getSnapshot('dsb_stock_v2')));
   window.before=repo.getSnapshot('dsb_stock_v2');
   await service.atomic(()=>{
    service.setCollection('dsb_stock_v2',[{id:'repo-product',name:'Repository Product',qty:12,costPrice:200,price:300}]);
    if(repo.getSnapshot('dsb_stock_v2')!==before)throw Error('Uncommitted data escaped');
   });
   const after=repo.getSnapshot('dsb_stock_v2');
   let protectedValue=false;try{after[0].qty=999}catch{protectedValue=true}
   return {notifications:seen.length,qty:after[0].qty,stable:after===repo.getSnapshot('dsb_stock_v2'),frozen:Object.isFrozen(after)&&Object.isFrozen(after[0]),stored:service.getObject('dsb_stock_v2')[0].qty};
  }''')
  assert result=={'notifications':1,'qty':12,'stable':True,'frozen':True,'stored':12},result
  ok('atomic commit publishes once; detached frozen snapshots keep stable identities')
  result=page.evaluate('''async()=>{
   window.failedBefore=repo.getSnapshot('dsb_stock_v2');const seenBefore=seen.length;
   const put=IDBObjectStore.prototype.put;let faults=0;
   IDBObjectStore.prototype.put=function(...args){if(this.name==='stockRecords'&&faults++<2)throw new DOMException('Repository quota test','QuotaExceededError');return put.apply(this,args)};
   let rejected=false;
   try{await service.atomic(()=>service.setCollection('dsb_stock_v2',[{...service.getObject('dsb_stock_v2')[0],qty:8}]))}catch{rejected=true}
   finally{IDBObjectStore.prototype.put=put}
   return {rejected,qty:service.getObject('dsb_stock_v2')[0].qty,unchanged:repo.getSnapshot('dsb_stock_v2')===failedBefore,notified:seen.length-seenBefore,error:repo.getStatus().error};
  }''')
  assert result['rejected'] and result['qty']==12 and result['unchanged'] and result['notified']==0 and result['error'],result
  ok('both IDB retry attempts fail; rollback never publishes rejected stock')
  page.evaluate('''async()=>{await service.atomic(()=>service.setCollection('dsb_stock_v2',[{...service.getObject('dsb_stock_v2')[0],qty:10}]))}''')
  assert page.evaluate('repo.getSnapshot("dsb_stock_v2")[0].qty')==10
  assert page.evaluate('repo.getStatus().error') is None
  ok('successful retry publishes persisted quantity and clears error')
  result=page.evaluate('''async()=>{
   const first=repo.getSnapshot('dsb_notes_v1');let notices=0;
   repo.subscribe('dsb_notes_v1',()=>notices++);
   service.set('dsb_notes_v1',JSON.stringify([{id:'repo-note',text:'Persisted note'}]));
   const pending=repo.getSnapshot('dsb_notes_v1')===first;
   await repo.settled();
   return {pending,notices,note:repo.getSnapshot('dsb_notes_v1')[0].text};
  }''')
  assert result=={'pending':True,'notices':1,'note':'Persisted note'},result
  ok('ordinary queued writes notify only after persistence')
  second=context.new_page();boot(second)
  second.evaluate('''async()=>{await service.atomic(()=>service.setCollection('dsb_stock_v2',[{...service.getObject('dsb_stock_v2')[0],qty:9}]))}''')
  page.wait_for_function('repo.getStatus().stale===true')
  assert page.evaluate('repo.getSnapshot("dsb_stock_v2")[0].qty')==10
  assert page.evaluate('''async()=>{try{await service.atomic(()=>service.setCollection('dsb_stock_v2',[]));return false}catch(e){return e.name==='StaleWindowError'}}''')
  assert second.evaluate('service.getObject("dsb_stock_v2")[0].qty')==9
  ok('external commit marks stale snapshot; stale writer cannot overwrite newer stock')
  boot(page)
  assert page.evaluate('repo.getSnapshot("dsb_stock_v2")[0].qty')==9
  assert page.evaluate('service.verify()')['ok']
  assert not errors,errors
  ok('reload reads durable records and complete database verification passes')
  (OUT/'repository-results.json').write_text(json.dumps({'passed':len(checks),'checks':checks},indent=2))
 finally:
  browser.close();server.shutdown();server.server_close()
