import os
import uuid
import shutil
import asyncio
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.vton_client import run_huggingface_vton
from app.scraper.playwright_hub import fetch_image

from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="AI Outfit Try-On API",
    description="Virtual try-on with product image scraping",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR", "downloads")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "temp_uploads")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "generated_results")
BASE_URL = os.getenv("BASE_URL")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

app.mount("/results", StaticFiles(directory=OUTPUT_DIR), name="results")


@app.get("/")
async def root():
    return {"message": "FastAPI engine is initialized"}


@app.get("/api/v1/health")
async def health_check():
    return {"status": "operational"}


@app.post("/api/v1/try-on")
async def try_on(
    person_image: UploadFile = File(...),
    product_url: str = Form(...)
):
    person_path = None
    garment_path = None  # actual file path, not URL

    try:
        person_filename = f"{uuid.uuid4().hex}_{person_image.filename}"
        person_path = os.path.join(UPLOAD_DIR, person_filename)
        with open(person_path, "wb") as buffer:
            shutil.copyfileobj(person_image.file, buffer)

        loop = asyncio.get_running_loop()  # fix: not get_event_loop()
        with ThreadPoolExecutor() as pool:
            garment_url = await loop.run_in_executor(pool, fetch_image, product_url)

        if not garment_url:
            raise ValueError("Scraper could not find a valid product image at the provided URL.")

        garment_filename = garment_url.split("/")[-1]
        garment_path = os.path.join(DOWNLOAD_DIR, garment_filename)

        if not os.path.exists(garment_path):
            raise ValueError(f"Scraped image file not found on disk: {garment_path}")

        with ThreadPoolExecutor() as pool:
            result_filename = await loop.run_in_executor(
                pool, run_huggingface_vton, person_path, garment_path, OUTPUT_DIR
            )

        return {
            "status": "success",
            "message": "Virtual try-on generated successfully!",
            "result_url": f"{BASE_URL}/results/{result_filename}"
        }

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up actual file paths
        for path in [person_path, garment_path]:
            if path and os.path.exists(path):
                os.remove(path)