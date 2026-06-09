import os
import uuid
import requests
from playwright.sync_api import sync_playwright

DOWNLOAD_DIR = "downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def fetch_image(url: str) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle", timeout=30000)
        
        # 1. Debug: Print how many images we found
        images = page.query_selector_all("img")
        print(f"Total images found on page: {len(images)}")
        
        best_img_src = None
        max_area = 0
        
        for img in images:
            # 2. Get the 'src' or 'data-src' (Zara often uses data-src for lazy loading)
            src = img.get_attribute("src") or img.get_attribute("data-src")
            if not src or "logo" in src or "icon" in src:
                continue
            
            box = img.bounding_box()
            if box:
                area = box['width'] * box['height']
                if area > max_area:
                    max_area = area
                    best_img_src = src
        
        # 3. CRITICAL: Stop if no image is found
        if not best_img_src:
            print("Error: No valid image found. The page might be blocking the bot.")
            browser.close()
            return None
        
        print(f"Found best image: {best_img_src}")
        
        # Ensure URL is absolute
        if best_img_src.startswith("//"):
            best_img_src = "https:" + best_img_src
            
        # Download
        file_path = os.path.join(DOWNLOAD_DIR, f"{uuid.uuid4().hex}.jpg")
        try:
            response = requests.get(best_img_src, headers={"User-Agent": "Mozilla/5.0"})
            with open(file_path, "wb") as f:
                f.write(response.content)
            browser.close()
            return file_path
        except Exception as e:
            print(f"Download error: {e}")
            browser.close()
            return None