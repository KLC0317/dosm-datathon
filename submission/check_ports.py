from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={'width': 1600, 'height': 1200})
    for port in [3000, 3001]:
        try:
            resp = page.goto(f'http://127.0.0.1:{port}', timeout=5000)
            print(f'Port {port}: status={resp.status if resp else None}, title={page.title()}')
        except Exception as e:
            print(f'Port {port}: failed {e}')
    b.close()
