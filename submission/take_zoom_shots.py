import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={'width': 1600, 'height': 1100})
    page.goto('http://127.0.0.1:3000', timeout=15000)
    page.wait_for_timeout(3000)

    map_elem = page.locator('.dual-region-map-shell')

    # 1. Default (starts with Putrajaya selected & zoomed into Putrajaya)
    map_elem.screenshot(path='submission/view_zoom_putrajaya.png')
    print('Saved view_zoom_putrajaya.png')

    # 2. Click Overview button in West card to show full map overview with Putrajaya callout line+box
    west_overview_btn = page.locator('.west-card .zoom-pill-btn')
    if west_overview_btn.count() > 0:
        west_overview_btn.click(force=True)
        page.wait_for_timeout(1000)
        map_elem.screenshot(path='submission/view_full_map_overview.png')
        print('Saved view_full_map_overview.png')

    # 3. Click on Kuala Lumpur marker to select and zoom in
    kl_marker = page.locator('.west-card text:has-text("KUALA LUMPUR")').first
    if kl_marker.count() > 0:
        kl_marker.click(force=True)
        page.wait_for_timeout(1000)
        map_elem.screenshot(path='submission/view_zoom_kuala_lumpur.png')
        print('Saved view_zoom_kuala_lumpur.png')

    # 4. Click on Labuan to select and zoom in
    lb_marker = page.locator('.east-card text:has-text("LABUAN")').first
    if lb_marker.count() > 0:
        lb_marker.click(force=True)
        page.wait_for_timeout(1000)
        map_elem.screenshot(path='submission/view_zoom_labuan.png')
        print('Saved view_zoom_labuan.png')

    # 5. Full dashboard screenshot
    page.screenshot(path='submission/view_full_dashboard_zoom.png', full_page=True)
    print('Saved view_full_dashboard_zoom.png')

    b.close()
