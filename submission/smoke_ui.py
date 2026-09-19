from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(headless=True); page=b.new_page(viewport={"width":1440,"height":1200}); page.goto('http://127.0.0.1:3001'); page.wait_for_timeout(4500)
 text=page.locator('body').inner_text(); checks=['How to use this workspace','Visitor demand forecast','Portfolio posture','From evidence to action','State pressure map','Pressure × prosperity']
 print({c:(c in text) for c in checks})
 page.get_by_role('button', name='What-if lab').click(); page.wait_for_timeout(300); print('scenario', 'Set guardrails' in page.locator('body').inner_text())
 page.get_by_role('button', name='Evidence & method').click(); page.wait_for_timeout(300); print('method', 'Official sources in this build' in page.locator('body').inner_text())
 b.close()
