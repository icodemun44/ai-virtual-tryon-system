import os
import threading
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

class APIKeyManager:
    # To manage multiple Gemini API keys, we implement a reactive rotation mechanism
    def __init__(self, keys_str: str | None):
        self._keys = [k.strip() for k in keys_str.split(",")] if keys_str else []
        self._current_index = 0
        self._lock = threading.Lock()

    @property
    def has_keys(self) -> bool:
        return bool(self._keys)

    @property
    def total_keys(self) -> int:
        return len(self._keys)

    def get_active_key(self) -> str:
        # Returns the current operational API key
        if not self._keys:
            raise ValueError("No API keys found in the rotation pool.")
        with self._lock:
            return self._keys[self._current_index]

    def rotate_to_next(self):
        # Explicitly shifts the pointer to the next key in the pool.
        # Called reactively when an active key encounters a 429 rate limit.
        if self.total_keys <= 1:
            return 
            
        with self._lock:
            old_index = self._current_index
            self._current_index = (self._current_index + 1) % self.total_keys
            return old_index


class Settings:
    PROJECT_NAME: str = "AI Outfit Try-On Core Engine"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Global instance of our reactive manager
    KEY_MANAGER = APIKeyManager(os.getenv("GEMINI_API_KEYS"))

settings = Settings()