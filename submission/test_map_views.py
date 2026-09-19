from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={'width': 1600, 'height': 1300})
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)

    # 1. Test Geo Map
    page.goto('http://127.0.0.1:3000', timeout=20000)
    page.wait_for_timeout(2500)
    page.screenshot(path='submission/view_geo_map.png')
    print('Geo Map Screenshot saved')

    # 2. Click Equal-Area Grid button
    page.click('button:has-text("Equal-Area Grid")')
    page.wait_for_timeout(1000)
    page.screenshot(path='submission/view_grid_map.png')
    print('Equal-Area Grid Screenshot saved')

    # 3. Click FT Epicenter button
    page.click('button:has-text("FT Epicenter")')
    page.wait_for_timeout(1000)
    page.screenshot(path='submission/view_ft_epicenter.png')
    print('FT Epicenter Screenshot saved')

    # 4. Click back to Geo Map and click Putrajaya
    page.click('button:has-text("Geo Map")')
    page.wait_for_timeout(1000)
    # Check if Putrajaya text is visible
    print("Putrajaya callout visible:", page.locator('text=Putrajaya • 82').is_visible())
    print("Kuala Lumpur callout visible:", page.locator('text=Kuala Lumpur • 71').is_visible())
    print("Errors:", errs)

    b.close()
