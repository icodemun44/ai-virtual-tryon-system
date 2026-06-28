import os
import uuid
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv


load_dotenv()

DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR")
BASE_URL = os.getenv("RESULT_URL")

if not DOWNLOAD_DIR:
    raise ValueError("DOWNLOAD_DIR environment variable is not set")
if not BASE_URL:
    raise ValueError("RESULT_URL environment variable is not set")

os.makedirs(DOWNLOAD_DIR, exist_ok=True)


def scrape_zara(page):
    page.mouse.wheel(0, 2000)
    page.wait_for_timeout(2000)
    imgs = page.query_selector_all("picture.media-image img")
    return imgs[2].get_attribute("src") if len(imgs) > 2 else None

def scrape_uniqlo(page):
    page.wait_for_selector(".media-gallery--grid", timeout=10000)
    gallery = page.query_selector(".media-gallery--grid")
    imgs = gallery.query_selector_all("img") if gallery else []
    
    if not imgs:
        return None
        
    img_element = imgs[-1]
    return img_element.get_attribute("data-src") or img_element.get_attribute("src")

SCRAPER_REGISTRY = {
    "uniqlo.com": scrape_uniqlo,
    "zara.com": scrape_zara
}

def fetch_image(url: str) -> str:
    user_data_dir = os.path.join(os.getcwd(), "chrome_profile")
    
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir,
            headless=True,
            channel="chrome",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        )
        page = context.pages[0]
        
        page.route("**/*", lambda route: route.abort() if any(t in route.request.url for t in ["analytics", "doubleclick"]) else route.continue_())
        
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            
            domain = next((d for d in SCRAPER_REGISTRY if d in url), None)
            if not domain:
                raise ValueError("No scraper registered for this site")
            
            target_url = SCRAPER_REGISTRY[domain](page)
            
            if target_url:
                if target_url.startswith("//"): 
                    target_url = "https:" + target_url
                
                response = page.request.get(target_url)
                
                if response.status == 200:
                    filename = f"{uuid.uuid4().hex}.jpg"
                    file_path = os.path.join(DOWNLOAD_DIR, filename)
                    
                    with open(file_path, "wb") as f:
                        f.write(response.body())
                    
                    return f"{BASE_URL}/{filename}"
                else:
                    print(f"Failed to fetch image. Status: {response.status}")
            return None
        finally:
            context.close()