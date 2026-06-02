from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AI Outfit Try-On API",
    description="Initial core backend workspace",
    version="1.0.0"
)

# Configure CORS for your Dashboard and Extension environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "FastAPI engine is initialized"}

@app.get("/api/v1/health")
async def health_check():
    return {"status": "operational", "scraper_module": "initialized"}

@app.post("/api/v1/scrape", status_code=status.HTTP_200_OK)
async def process_url_extraction(payload: ScrapePayload):
    if not payload.url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target URL string cannot be empty."
        )
        
    try:
        scraped_asset_url = await extract_product_image(payload.url)
        return {"status" : "succcess",
                "source_marketplace_url": payload.url,
                "extracted_asset_url": scraped_asset_url
                }
    except ValueError as value_error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(value_error)
        )
    except Exception as general_error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during scraping: {str(general_error)}"
        )
