import os
import uuid
import requests
from playwright.sync_api import sync_playwright

DOWNLOAD_DIR = "downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def fetch_image(url: str) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720}
        )
        page = context.new_page()
        
        try:
            print(f"Navigating to: {url}")
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            
            
            
            overlay_selectors = [
                "button[id*='onetrust-accept']", 
                "button[class*='go-to-site']",    
                "a[class*='region']",             
                "button[aria-label='Close']"      
            ]
            
            for selector in overlay_selectors:
                if page.is_visible(selector):
                    page.click(selector)
                    print(f"Clicked overlay: {selector}")
                    page.wait_for_timeout(1000) 
            

            page.wait_for_timeout(5000) 
            page.mouse.wheel(0, 1500)
            page.wait_for_timeout(3000)
            
            images = page.query_selector_all("img")
            print(f"Total images found: {len(images)}")
            
            best_img_src = None
            max_area = 0
            for img in images:
                src = img.get_attribute("src") or img.get_attribute("data-src")
                if not src or "logo" in src: continue
                box = img.bounding_box()
                if box:
                    area = box['width'] * box['height']
                    if area > max_area:
                        max_area = area
                        best_img_src = src
            
            if best_img_src:
                if best_img_src.startswith("//"): best_img_src = "https:" + best_img_src
                file_path = os.path.join(DOWNLOAD_DIR, f"{uuid.uuid4().hex}.jpg")
                with open(file_path, "wb") as f:
                    
                    f.write(requests.get(best_img_src, headers={"User-Agent": "Mozilla/5.0"}).content)
                return file_path
            return None
        finally:
            browser.close()