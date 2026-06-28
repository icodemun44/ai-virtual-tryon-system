import os
import shutil
import time
import traceback
from gradio_client import Client, handle_file
from huggingface_hub import login
from app.core.config import settings


def run_huggingface_vton(
    person_img_path: str,
    garment_img_path: str,
    output_dir: str
) -> str:
    manager = settings.HF_TOKEN_MANAGER

    person_image = {
        "background": handle_file(person_img_path),
        "layers": [],
        "composite": None
    }
    garment_image = handle_file(garment_img_path)

    result = None

    for attempt in range(manager.total_tokens):
        try:
            # Login with current active token before each attempt
            if manager.has_tokens:
                token = manager.get_active_token()
                login(token=token, add_to_git_credential=False)
                print(f"🔑 Using HF token index {manager._current_index}")
            else:
                print("⚠️ No HF tokens configured, using anonymous access")

            print(f"🔗 Connecting to Hugging Face API (attempt {attempt + 1})...")
            client = Client("yisol/IDM-VTON", verbose=True)

            print("🚀 Sending request to IDM-VTON...")
            result = client.predict(
                person_image,
                garment_image,
                "",       
                True,    
                False,   
                30,     
                42,     
                api_name="/tryon"
            )

            print("✅ HF response received!")
            break

        except Exception as e:
            error_msg = str(e)
            print(f"❌ Attempt {attempt + 1} failed: {error_msg}")

            # Rotate token if quota exceeded
            if "quota" in error_msg.lower() or "exceeded" in error_msg.lower():
                old = manager.rotate_to_next()
                if old is None:
                    raise RuntimeError("🔥 All HuggingFace tokens have exceeded their quota.")
                print(f"🔄 Quota exceeded — rotated from token {old} to token {manager._current_index}")
            elif attempt < 4:
                wait = (attempt + 1) * 5
                print(f"⏳ Waiting {wait}s before retry...")
                time.sleep(wait)

    if not result:
        raise RuntimeError("HuggingFace IDM-VTON failed after all retries")

    try:
        generated_temp_path = result[0]

        output_filename = f"hf_result_{os.path.basename(person_img_path)}"
        final_output_path = os.path.join(output_dir, output_filename)

        shutil.copyfile(generated_temp_path, final_output_path)

        print(f"🎉 Success! Image saved at: {final_output_path}")
        return output_filename

    except Exception as e:
        print("❌ Error while processing HF output:")
        print(traceback.format_exc())
        raise RuntimeError("Failed to process HuggingFace output")