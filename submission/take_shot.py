from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={'width': 1600, 'height': 1200})
    page.goto('http://127.0.0.1:3001', timeout=15000)
    page.wait_for_timeout(2500)
    page.screenshot(path='submission/current_screen.png')
    print('Screenshot saved!')
    b.close()
