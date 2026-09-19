from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={'width': 1600, 'height': 1400})
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)

    print("Navigating to http://127.0.0.1:3000...")
    page.goto('http://127.0.0.1:3000', timeout=30000)
    page.wait_for_timeout(3000)

    # 1. Capture map panel only
    page.locator('.map-panel').screenshot(path='submission/view_dual_region_map.png')
    print("Screenshot saved to submission/view_dual_region_map.png")

    # 2. Check visibility of territories
    kl_visible = page.locator('text=KUALA LUMPUR').first.is_visible()
    pjy_visible = page.locator('text=PUTRAJAYA').first.is_visible()
    penang_visible = page.locator('text=PENANG').first.is_visible()
    labuan_visible = page.locator('text=LABUAN').first.is_visible()
    print(f"Kuala Lumpur visible: {kl_visible}")
    print(f"Putrajaya visible: {pjy_visible}")
    print(f"Penang visible: {penang_visible}")
    print(f"Labuan visible: {labuan_visible}")

    # 3. Click on Kuala Lumpur
    print("Clicking on Kuala Lumpur...")
    page.locator('text=KUALA LUMPUR').first.click(force=True)
    page.wait_for_timeout(1000)
    page.locator('.map-panel').screenshot(path='submission/view_dual_map_kl_selected.png')
    print("Screenshot with KL selected saved")

    # 4. Click on Putrajaya
    print("Clicking on Putrajaya...")
    page.locator('text=PUTRAJAYA').first.click(force=True)
    page.wait_for_timeout(1000)
    page.locator('.map-panel').screenshot(path='submission/view_dual_map_pjy_selected.png')
    print("Screenshot with Putrajaya selected saved")

    # 5. Full dashboard screenshot
    page.screenshot(path='submission/view_full_dashboard_dual_map.png')
    print("Full dashboard screenshot saved")

    print("Errors:", errs)
    b.close()
