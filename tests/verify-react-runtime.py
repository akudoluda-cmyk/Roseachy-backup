#!/usr/bin/env python3
"""Actual Vite/React browser smoke. Disposable contexts, no injected business hooks."""
import argparse
import json
import socket
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'tests/evidence'


def run(mode):
    OUT.mkdir(exist_ok=True)
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    url = f'http://127.0.0.1:{port}'
    command = ['node', 'node_modules/vite/bin/vite.js']
    if mode == 'preview':
        command.append('preview')
    command += ['--host', '127.0.0.1', '--port', str(port), '--strictPort']
    checks = []
    def passed(name):
        checks.append(name)
        print('PASS', mode, name, flush=True)
    with (OUT / f'{mode}-server.log').open('w') as log:
        server = subprocess.Popen(command, cwd=ROOT, stdout=log, stderr=log)
        try:
            for _ in range(100):
                if server.poll() is not None:
                    raise RuntimeError('Vite exited; inspect server log')
                try:
                    with urlopen(url, timeout=1) as response:
                        if response.status == 200:
                            break
                except OSError:
                    time.sleep(.1)
            else:
                raise RuntimeError('Vite did not become ready')
            with sync_playwright() as pw:
                browser = pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
                for width in (1280, 390):
                    context = browser.new_context(viewport={'width':width, 'height':900}, service_workers='allow' if mode == 'preview' else 'block')
                    context.tracing.start(screenshots=True, snapshots=True, sources=True)
                    page = context.new_page()
                    errors, failed = [], []
                    page.on('pageerror', lambda e: errors.append(str(e)))
                    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
                    page.on('response', lambda r: failed.append(f'{r.status} {r.url}') if r.status >= 400 else None)
                    try:
                        page.goto(url, wait_until='networkidle')
                        page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
                        assert page.locator('[data-react-filter]').count() == 8
                        assert page.evaluate('RoseachyStore.status().mode') == 'indexeddb'
                        assert page.evaluate('RoseachyStore.status().dbVersion') == 8
                        expect(page.locator('#tabBtnTx')).to_be_visible()
                        passed(f'{width}: React boot, navigation, eight filters, IndexedDB v8')
                        page.locator('#tabBtnStock').click()
                        page.locator('[data-target="stockEntryBody"]').click()
                        page.locator('#stockDivision').select_option('essentials')
                        for field, value in [('stockName','Migration Test Product'),('stockQty','12'),('stockCost','200'),('stockPrice','300')]:
                            page.locator('#'+field).fill(value)
                        page.locator('#stockAddBtn').click()
                        expect(page.locator('#stockTable')).to_contain_text('Migration Test Product')
                        page.evaluate('RoseachyStore.whenSaved()')
                        assert page.evaluate('RoseachyStore.getObject("dsb_stock_v2")[0].qty') == 12
                        passed(f'{width}: product creation through actual UI')
                        page.locator('#stockSearch').fill('does not exist')
                        expect(page.locator('#stockTable')).not_to_contain_text('Migration Test Product')
                        page.locator('[data-react-filter-reset="stock"]').click()
                        expect(page.locator('#stockTable')).to_contain_text('Migration Test Product')
                        expect(page.locator('#stockSearch')).to_have_value('')
                        passed(f'{width}: React filtering, reset and table rendering')
                        page.screenshot(path=str(OUT / f'{mode}-stock-{width}.png'), full_page=True)
                        page.locator('#tabBtnTx').click()
                        page.locator('#note').fill('Migration Test')
                        page.locator('[data-product-suggest]').click()
                        page.locator('#qty').fill('2')
                        page.locator('#custPaid').fill('600')
                        page.locator('#addBtn').click()
                        expect(page.locator('#ledger')).to_contain_text('₦600.00')
                        page.evaluate('RoseachyStore.whenSaved()')
                        def verify_sale():
                            state = page.evaluate('({stock:RoseachyStore.getObject("dsb_stock_v2"), draft:RoseachyStore.getObject("dsb_draft_v2")})')
                            assert len(state['stock']) == 1 and state['stock'][0]['qty'] == 10
                            tx = state['draft']['tx']
                            assert len(tx) == 1 and tx[0]['amount'] == 600 and tx[0]['qty'] == 2 and tx[0]['type'] == 'sale_cash'
                            assert tx[0]['productId'] == state['stock'][0]['id']
                        verify_sale()
                        passed(f'{width}: cash sale ₦600, one transaction, quantity 12 → 10')
                        page.reload(wait_until='networkidle')
                        page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
                        verify_sale()
                        assert page.evaluate('RoseachyStore.verify()')['ok']
                        passed(f'{width}: sale and inventory survive reload; database verifies')
                        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
                        page.screenshot(path=str(OUT / f'{mode}-sales-{width}.png'), full_page=True)
                        if mode == 'preview':
                            page.evaluate('navigator.serviceWorker.ready')
                            page.reload(wait_until='networkidle')
                            page.wait_for_function('!!navigator.serviceWorker.controller && window.__roseachyFirstUsableMs !== undefined')
                            context.set_offline(True)
                            page.reload(wait_until='networkidle')
                            page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
                            verify_sale()
                            passed(f'{width}: production service-worker offline reload preserves records')
                        assert not errors, errors
                        assert not failed, failed
                        passed(f'{width}: no browser errors, HTTP failures or horizontal overflow')
                        context.tracing.stop()
                    except Exception:
                        page.screenshot(path=str(OUT / f'{mode}-{width}-failure.png'), full_page=True)
                        context.tracing.stop(path=str(OUT / f'{mode}-{width}-failure.zip'))
                        raise
                    finally:
                        context.close()
                browser.close()
        finally:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait()
    (OUT / f'{mode}-results.json').write_text(json.dumps({'at':datetime.now(timezone.utc).isoformat(),'mode':mode,'passed':len(checks),'checks':checks},indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', choices=['dev','preview'], default='preview')
    run(parser.parse_args().mode)
