from playwright.sync_api import sync_playwright
from pathlib import Path
out=Path('submission/Destinasi_Seimbang_Dashboard_Static.pdf')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True); page=b.new_page(viewport={"width":1440,"height":1100})
 page.goto('http://127.0.0.1:3003', wait_until='domcontentloaded', timeout=60000); page.wait_for_timeout(6000)
 page.pdf(path=str(out),format='A3',landscape=True,print_background=True,margin={"top":"8mm","right":"8mm","bottom":"8mm","left":"8mm"}); b.close()
print(out, out.stat().st_size)

