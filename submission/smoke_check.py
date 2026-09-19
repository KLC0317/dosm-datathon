from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(headless=True); page=b.new_page(viewport={"width":1440,"height":1200}); errs=[]; page.on('pageerror', lambda e: errs.append(str(e))); page.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
 page.goto('http://127.0.0.1:3014', wait_until='networkidle', timeout=60000); page.wait_for_timeout(2500)
 txt=page.locator('body').inner_text(); print('text',len(txt)); print({k:(k in txt) for k in ['Visitor demand forecast','Portfolio posture','Pressure × prosperity']}); print('errors',errs[:5]); print('svg',page.locator('svg').count()); page.screenshot(path='submission/vega-preview.png', full_page=True); b.close()

