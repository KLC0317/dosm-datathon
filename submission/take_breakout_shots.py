import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={'width': 1600, 'height': 1280})
    page.goto('http://127.0.0.1:3000', timeout=15000)
    page.wait_for_timeout(3000)

    # Screenshot 1: Dual Map with both drawn-out breakouts
    map_elem = page.locator('.dual-region-map-shell')
    if map_elem.count() > 0:
        map_elem.screenshot(path='submission/view_drawn_breakouts.png')
        print('Saved view_drawn_breakouts.png')

    # Screenshot 2: Click Kuala Lumpur chip / polygon
    kl_chip = page.locator('.breakout-chip:has-text("Kuala Lumpur")').first
    if kl_chip.count() > 0:
        kl_chip.click(force=True)
        page.wait_for_timeout(1000)
        map_elem.screenshot(path='submission/view_kl_selected_breakout.png')
        print('Saved view_kl_selected_breakout.png')

    # Screenshot 3: Click Labuan chip / polygon
    lb_chip = page.locator('.breakout-chip:has-text("W.P. Labuan")').first
    if lb_chip.count() > 0:
        lb_chip.click(force=True)
        page.wait_for_timeout(1000)
        map_elem.screenshot(path='submission/view_labuan_selected_breakout.png')
        print('Saved view_labuan_selected_breakout.png')

    # Screenshot 4: Full dashboard
    page.screenshot(path='submission/view_full_dashboard_with_breakouts.png', full_page=True)
    print('Saved view_full_dashboard_with_breakouts.png')

    b.close()
