from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(headless=True); page=b.new_page(viewport={"width":1440,"height":1200}); page.goto('http://127.0.0.1:3009'); page.wait_for_timeout(5000); page.screenshot(path='submission/light-dashboard-preview.png',full_page=True); print(len(page.locator('body').inner_text())); b.close()

