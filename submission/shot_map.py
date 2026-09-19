from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={'width': 1600, 'height': 1400})
    page.goto('http://127.0.0.1:3000')
    page.wait_for_timeout(3000)
    page.locator('.map-panel').screenshot(path='submission/map_panel_only.png')
    b.close()
print('Map panel screenshot saved')
