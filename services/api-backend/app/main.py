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