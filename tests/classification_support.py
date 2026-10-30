"""Browser acceptance tests. Test-only private hooks are served in memory, never shipped."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
import json, re, subprocess, time
ROOT=Path(__file__).resolve().parents[1]
HOOKS='getStock,setStock,getMarketState,setMarketState,classificationData,classificationWrite,classificationRestore,classificationDestination,classificationMarketAssignment,classificationGroups,classificationPath,classificationRefreshControls,inventoryCommit,calc,renderStock,renderMarket,setTab,switchDesk,enterStockMultiMode,toggleStockSelection,roseachySafeBackup,applyBackupData,backupObject,SyncPrivacy,SmartSync,normalizeProduct,saveUIState,getUIState,openMarketStock,marketStateMut,ensureSelectedMarketList,syncCompatToList,applyOneMarketItem,selectedMarketActiveList,allMarketActiveItems,validateFullBackup,stockExportObject,restoreWorkingStockBackup,validateWorkingStockBackup,buildLowStockPdf,parseBulkDivision,classificationValidateProducts,saveAppearanceSettings,getAppearanceSettings'
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):
  if self.path in ['/','/index.html']:
   html=(ROOT/'index.html').read_text().replace('const api={start,authenticate', 'const api={testFlatten:flatten,testReconstruct:reconstruct,start,authenticate').replace('init().then(()=>{backupSetupWorking();',f'Object.assign(window,{{{HOOKS}}});window.testSeed=(data)=>inventoryCommit(()=>{{classificationWrite(data.classifications);setStock(data.stock);openingStock=stockSnapshot();saveDraft();return true;}},"Fixture");window.testState=()=>({{tx,openingStock,selected:[...stockSelectedIds],busy:inventoryBusy}});init().then(()=>{{backupSetupWorking();')
   body=html.encode();self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers();self.wfile.write(body)
  else:super().do_GET()
server=ThreadingHTTPServer(('127.0.0.1',8044),partial(Handler,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
