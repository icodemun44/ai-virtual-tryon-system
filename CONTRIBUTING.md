# Contributing to YouDress

Thanks for your interest in contributing! This document covers everything you need to know to get started.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Adding a New Site Scraper](#adding-a-new-site-scraper)
- [Working on the Backend](#working-on-the-backend)
- [Working on the Browser Extension](#working-on-the-browser-extension)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Code Style](#code-style)

---

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/ai-virtual-tryon-system.git
   ```
3. Follow the full setup guide in [README.md](./README.md) to get the project running locally
4. Create a new branch for your change:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Project Structure

```
ai-virtual-tryon-system/
├── apps/
│   ├── browser-extension/         # Chrome extension
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── MainView.jsx   # Main try-on UI after photo upload
│   │   │   │   ├── UploadView.jsx # Photo upload screen
│   │   │   │   └── TryonButton.jsx
│   │   │   ├── background.js      # Chrome service worker
│   │   │   ├── config.js          # API URL config (reads from .env)
│   │   │   └── App.jsx
│   │   └── public/
│   │       └── manifest.json
│   └── web-dashboard/             # WIP — not functional yet
└── services/
    └── api-backend/
        └── app/
            ├── core/
            │   └── config.py      # Backend settings and HF token manager
            ├── scraper/
            │   └── playwright_hub.py  # ← Add new site scrapers here
            ├── main.py            # FastAPI routes
            ├── vton_client.py     # HuggingFace IDM-VTON integration
            └── run.py
```

---

## Adding a New Site Scraper

This is the most impactful contribution you can make. Currently only Zara and Uniqlo are supported. Adding a new site means more users can try on clothes from that store.

All scrapers live in `services/api-backend/app/scraper/playwright_hub.py`.

### How scrapers work

Each scraper is a function that receives a Playwright `page` object (already navigated to the product URL) and returns the direct image URL of the main product photo.

```python
def scrape_yoursite(page) -> str | None:
    # page is already at the product URL
    # return the src URL of the main product image, or None if not found
    pass
```

### Step-by-step guide

**Step 1 — Inspect the product page**

Open a product page on the site you want to support. Open Chrome DevTools (F12) → Elements tab. Find the main product image and inspect its HTML to identify a reliable CSS selector.

Things to look for:

- A unique class on the `<img>` tag or its parent `<picture>` element
- Whether the image URL is in `src`, `data-src`, or `srcset`
- Whether you need to scroll or wait for the image to load

**Step 2 — Write the scraper function**

```python
def scrape_hm(page):
    # Wait for the image gallery to appear
    page.wait_for_selector(".product-detail-main-image-container", timeout=10000)

    # Get the main product image
    img = page.query_selector(".product-detail-main-image-container img")
    if not img:
        return None

    # Some sites use data-src for lazy loading
    return img.get_attribute("data-src") or img.get_attribute("src")
```

Common patterns you may need:

```python
# Scroll to trigger lazy loading
page.mouse.wheel(0, 1000)
page.wait_for_timeout(2000)

# Wait for a specific element
page.wait_for_selector(".your-selector", timeout=10000)

# Get all images and pick one by index
imgs = page.query_selector_all(".gallery img")
return imgs[0].get_attribute("src") if imgs else None

# Handle protocol-relative URLs (starts with //)
url = img.get_attribute("src")
if url and url.startswith("//"):
    url = "https:" + url
return url
```

**Step 3 — Register your scraper**

Add your function to the `SCRAPER_REGISTRY` dictionary:

```python
SCRAPER_REGISTRY = {
    "uniqlo.com": scrape_uniqlo,
    "zara.com": scrape_zara,
    "hm.com": scrape_hm,        # ← add your entry here
}
```

The key must be a string that appears in the product page URL (the domain).

**Step 4 — Test it**

Start the backend and try a real product URL from your site through the extension or directly via the API:

```bash
curl -X POST http://localhost:8000/api/v1/try-on \
  -F "person_image=@/path/to/photo.jpg" \
  -F "product_url=https://www.hm.com/your-product-page"
```

**Step 5 — Update the supported sites table in README.md**

```markdown
| H&M | ✅ Supported |
```

### Tips

- Test with multiple product pages from the same site — selectors can vary between categories
- Some sites require scrolling before images load (`page.mouse.wheel`)
- Some sites block headless browsers — check if adding a `user_agent` string helps
- If the site uses infinite scroll or overlays on load, add appropriate `wait_for_timeout` calls

---

## Working on the Backend

The backend is a FastAPI app in `services/api-backend/`.

**Always run from the correct directory:**

```bash
cd services/api-backend
uvicorn app.main:app --reload
```

Running from any other directory will cause import errors.

**Key files:**

- `app/main.py` — API routes. The main endpoint is `POST /api/v1/try-on`
- `app/vton_client.py` — Sends images to HuggingFace IDM-VTON. If the model API changes, update here
- `app/core/config.py` — Reads `.env` and manages HuggingFace token rotation
- `app/scraper/playwright_hub.py` — All site scrapers live here

**Adding a new API endpoint:**

Add your route to `app/main.py` following the existing FastAPI pattern. Keep error handling consistent — use `HTTPException` with appropriate status codes.

---

## Working on the Browser Extension

The extension is in `apps/browser-extension/`.

**Development workflow:**

```bash
cd apps/browser-extension
pnpm install
pnpm build
```

After every code change, run `pnpm build` again, then go to `chrome://extensions` and click the **refresh icon** on the YouDress extension card to reload it.

**Key files:**

- `src/App.jsx` — Root component, handles photo upload state
- `src/components/UploadView.jsx` — First screen, photo upload UI
- `src/components/MainView.jsx` — Main try-on UI after photo is set
- `src/background.js` — Chrome service worker, handles background API calls
- `src/config.js` — API URL config, reads from `.env`
- `public/manifest.json` — Chrome extension manifest

**Changing the API URL:**

Don't hardcode URLs. Use the config:

```javascript
import { TRYON_ENDPOINT } from "../config.js";
```

**Environment variables** in the extension must be prefixed with `VITE_` to be accessible at build time:

```javascript
// .env
VITE_API_BASE_URL=http://localhost:8000

// In code
const url = import.meta.env.VITE_API_BASE_URL;
```

---

## Submitting a Pull Request

1. Make sure the backend server starts without errors
2. Make sure the extension builds without errors (`pnpm build`)
3. Test your change end-to-end with a real product URL
4. Keep your PR focused — one feature or fix per PR
5. Write a clear PR description explaining what you changed and why
6. If you added a new scraper, mention which product pages you tested with

### PR title format

```
feat: add H&M scraper
fix: handle protocol-relative image URLs in scraper
docs: update setup instructions for macOS
refactor: move API URL to config
```

---

## Code Style

**Python (backend):**

- Follow PEP 8
- Use type hints where practical
- Keep scraper functions focused — one function per site

**JavaScript (extension):**

- Functional React components with hooks
- Tailwind CSS for styling — no inline style objects unless necessary
- No hardcoded URLs — always use `config.js`

**General:**

- No secrets or API keys in code or commits
- No committing generated images (`generated_results/`, `app/downloads/`)
- Keep `.env` out of commits — only `.env.example` gets committed

---

## Questions

Open an issue on GitHub if you're stuck or have a question before starting work on a larger feature. It's better to discuss first than to build something that doesn't fit the project direction.
