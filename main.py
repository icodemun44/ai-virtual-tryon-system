
import base64
import os
import tempfile
from io import BytesIO
from PIL import Image
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from gradio_client import Client, handle_file

load_dotenv()

app = FastAPI(title="Virtual Try-On API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_TOKEN = os.getenv("HF_TOKEN")  # optional but recommended to avoid rate limits


def process_and_save_image(upload_file: UploadFile) -> str:
    """Process uploaded image, save to temp file, return path."""
    contents = upload_file.file.read()
    try:
        img = Image.open(BytesIO(contents))
        if img.mode != "RGB":
            img = img.convert("RGB")
        img.thumbnail((768, 1024), Image.Resampling.LANCZOS)

        # Save to a temp file — gradio_client needs a file path
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        img.save(tmp.name, format="JPEG", quality=85)
        return tmp.name
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")


@app.post("/try-on")
async def virtual_try_on(
    person_image: UploadFile = File(...),
    clothes_image: UploadFile = File(...)
):
    person_path = None
    clothes_path = None

    try:
        # Validate extensions
        allowed = {"jpg", "jpeg", "png", "webp"}
        if person_image.filename.split(".")[-1].lower() not in allowed or \
           clothes_image.filename.split(".")[-1].lower() not in allowed:
            raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP allowed")

        # Save images to temp files
        person_path = process_and_save_image(person_image)
        clothes_path = process_and_save_image(clothes_image)

        # Connect to IDM-VTON Hugging Face Space
        client = Client("yisol/IDM-VTON", token=HF_TOKEN)

        # Call the tryon endpoint
        result = client.predict(
            dict={"background": handle_file(person_path), "layers": [], "composite": None},
            garm_img=handle_file(clothes_path),
            garment_des="clothing item",   # short description of garment (can be anything)
            is_checked=True,               # use auto-masking
            is_checked_crop=False,
            denoise_steps=30,              # higher = better quality, slower (20-40)
            seed=42,
            api_name="/tryon"
        )

        # result is a tuple: (output_image_path, masked_image_path)
        output_image_path = result[0]

        # Read result image and encode to base64
        with open(output_image_path, "rb") as f:
            image_bytes = f.read()

        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        return JSONResponse(content={
            "success": True,
            "message": "Virtual try-on completed!",
            "generated_image": f"data:image/png;base64,{image_base64}"
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing images: {str(e)}")

    finally:
        # Clean up temp files
        for path in [person_path, clothes_path]:
            if path and os.path.exists(path):
                os.unlink(path)


@app.get("/")
async def root():
    return {"message": "Virtual Try-On API running!"}

@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)