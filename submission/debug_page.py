from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(headless=True); page=b.new_page()
 page.on('console', lambda msg: print('console',msg.type,msg.text))
 page.on('pageerror', lambda e: print('error',e))
 resp=page.goto('http://127.0.0.1:3000',wait_until='domcontentloaded',timeout=20000)
 print('status',resp.status if resp else None, 'url',page.url)
 print('html',len(page.content()), 'text',page.locator('body').inner_text(timeout=5000)[:500])
 b.close()
