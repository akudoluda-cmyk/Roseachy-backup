"""Day Setup/closing-count parity using real production UI and IndexedDB."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from tempfile import TemporaryDirectory
from datetime import datetime, timezone
import hashlib, json, zipfile
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OPENINGS = ['openingCash', 'posOpeningCash', 'posOpeningElectronic', 'openingDebt']
COUNTS = ['actualCash', 'actualBankMovement', 'actualPosCash', 'actualPosElectronic']
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

def fixture(browser, root, label, width):
    out = ROOT/'tests/evidence'/f'day-setup-{width}'
    out.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(root)))
    Thread(target=server.serve_forever, daemon=True).start()
    context = browser.new_context(service_workers='block', timezone_id='Africa/Lagos', viewport={'width':width, 'height':900})
    context.tracing.start(screenshots=True, snapshots=True)
    page = context.new_page(); errors = []; checks = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('dialog', lambda d: d.accept())
    def ok(name):
        checks.append(name); print('PASS', label, width, name, flush=True)
    def settled(): page.evaluate('RoseachyStore.whenSaved()')
    def draft(): return page.evaluate('RoseachyStore.getObject("dsb_draft_v2")')
    def open_setup():
        toggle = page.locator('[data-target="daySetupBody"]')
        if toggle.get_attribute('aria-expanded') != 'true': toggle.click()
    def settings():
        page.locator('#deskMenuBtn').click(); page.locator('#deskMenu [data-desk="settings"]').click()
        advanced = page.locator('#settingsDesk details').filter(has=page.locator('#openingUnlockBtn'))
        if advanced.get_attribute('open') is None: advanced.locator('summary').click()
        page.locator('#openingUnlockBtn').click()
        expect(page.locator('#setupCorrectionOverlay')).to_be_visible()
    def sales():
        page.locator('#deskMenuBtn').click(); page.locator('#deskMenu [data-desk="sales"]').click()
    try:
        page.clock.set_fixed_time(datetime(2026,11,13,10,tzinfo=timezone.utc))
        page.goto(f'http://127.0.0.1:{server.server_port}', wait_until='networkidle')
        page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
        if label == 'react': expect(page.locator('[data-react-day-setup-field]')).to_have_count(10)
        page.locator('#date').fill('2026-12-31'); page.locator('#date').blur()
        page.locator('#openingCash').fill('-1'); page.locator('#finDayConfirm').click()
        expect(page.locator('#toast')).to_contain_text('Correct the opening balances')
        assert not page.evaluate('RoseachyStore.getObject("roseachy_finance_review_v1")?.confirmed?.["2026-12-31"]')
        for key, value in zip(OPENINGS, ['100.25','200.50','300.75','']): page.locator('#'+key).fill(value)
        settled(); before = draft()['fields']
        page.reload(wait_until='networkidle'); page.wait_for_function('window.__roseachyFirstUsableMs !== undefined'); open_setup()
        for key in OPENINGS: expect(page.locator('#'+key)).to_have_value(before[key])
        ok('invalid opening rejected; decimal drafts and business date survive reload')
        page.locator('#finDayConfirm').evaluate('(button)=>{button.click();button.click()}')
        expect(page.locator('#toast')).to_contain_text('Day Setup confirmed'); settled(); open_setup()
        for key in ['date', *OPENINGS, 'finDayConfirm']: expect(page.locator('#'+key)).to_be_disabled()
        expect(page.locator('#openingDebt')).to_have_value('0')
        confirmed = page.evaluate('RoseachyStore.getObject("roseachy_finance_review_v1").confirmed')
        assert list(confirmed) == ['2026-12-31']
        page.reload(wait_until='networkidle'); page.wait_for_function('window.__roseachyFirstUsableMs !== undefined'); open_setup()
        for key in ['date', *OPENINGS, 'finDayConfirm']: expect(page.locator('#'+key)).to_be_disabled()
        ok('confirmation normalizes blank opening, locks fields and persists once across reload')
        settings()
        page.locator('#setupEdit_openingCash').fill('123.456'); page.locator('#setupCorrectionSave').click()
        expect(page.locator('#setupCorrectionError')).to_contain_text('two decimal places')
        page.locator('#setupEdit_openingCash').fill('125.50'); page.locator('#setupCorrectionSave').click()
        expect(page.locator('#setupCorrectionOverlay')).not_to_be_visible(); settled(); sales(); open_setup()
        expect(page.locator('#openingCash')).to_have_value('125.5'); expect(page.locator('#openingCash')).to_be_disabled()
        assert draft()['fields']['openingCash'] == '125.5'
        ok('Settings correction validates precision and refreshes locked setup fields')
        page.locator('#actualCash').fill('120.25'); page.locator('#actualBankMovement').fill('-10.50')
        page.locator('#sumView [data-v="pos"]').click()
        page.locator('#actualPosCash').fill('190.50'); page.locator('#actualPosElectronic').fill('295.75')
        settled(); values = draft()['fields']
        page.locator('#tabBtnStock').click(); page.locator('#tabBtnTx').click()
        page.reload(wait_until='networkidle'); page.wait_for_function('window.__roseachyFirstUsableMs !== undefined')
        for key in COUNTS: expect(page.locator('#'+key)).to_have_value(values[key])
        ok('all four reconciliation counts preserve decimals and signed bank movement across navigation/reload')
        page.locator('#clearBtn').evaluate('(button)=>{button.click();button.click()}')
        expect(page.locator('#toast')).to_contain_text('New day ready'); settled(); open_setup()
        result = draft(); assert result['fields']['date'] == '2027-01-01'
        for key, value in zip(OPENINGS, ['120.25','190.50','295.75','0.00']):
            assert result['fields'][key] == value; expect(page.locator('#'+key)).to_have_value(value)
            expect(page.locator('#'+key)).to_be_enabled()
        for key in COUNTS: expect(page.locator('#'+key)).to_have_value('')
        saved = page.evaluate('RoseachyStore.getObject("dsb_saved_v2")'); assert len(saved) == 1
        assert saved[0]['date'] == '2026-12-31' and saved[0]['fields']['actualBankMovement'] == '-10.50'
        assert page.evaluate('RoseachyStore.verify()')['ok']; assert not errors, errors
        ok('duplicate year-boundary transition carries counts once, clears reconciliation and unlocks new setup')
        page.screenshot(path=str(out/f'{label}.png'), full_page=True)
        (out/f'{label}-results.json').write_text(json.dumps({'checks':checks,'errors':errors,'draft':result}, indent=2))
        context.tracing.stop()
        return {'fields':result['fields'],'tx':result['tx'],'savedFields':saved[0]['fields']}
    except Exception:
        page.screenshot(path=str(out/f'{label}-failure.png'), full_page=True)
        context.tracing.stop(path=str(out/f'{label}-failure.zip')); raise
    finally:
        context.close(); server.shutdown(); server.server_close()

archive = ROOT/'reference/original-2.17.2.zip'
assert hashlib.sha256(archive.read_bytes()).hexdigest() == '55a9a1ba418c910d2065240bffe4a385a449f285f8e973cd335e9722be9e1a04'
with TemporaryDirectory() as temp, sync_playwright() as pw:
    with zipfile.ZipFile(archive) as z: z.extractall(temp)
    browser = pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    try:
        for width in [1280,390]:
            original = fixture(browser, Path(temp), 'original', width)
            react = fixture(browser, ROOT/'dist', 'react', width)
            assert original == react, 'Opening/count/day fields differ from original'
            print('PASS exact Day Setup and reconciliation parity', width, flush=True)
    finally: browser.close()
