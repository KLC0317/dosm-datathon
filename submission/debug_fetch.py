from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(headless=True); page=b.new_page(); page.goto('http://127.0.0.1:3001'); page.wait_for_timeout(5000)
 txt=page.locator('body').inner_text(); print(len(txt)); print(txt.encode('ascii','ignore').decode()[:300]); b.close()
