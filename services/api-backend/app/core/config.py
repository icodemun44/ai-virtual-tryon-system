import os
import threading
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)


class HFTokenManager:
    def __init__(self, tokens_str: str | None):
        self._tokens = [t.strip() for t in tokens_str.split(",")] if tokens_str else []
        self._current_index = 0
        self._lock = threading.Lock()

    @property
    def has_tokens(self) -> bool:
        return bool(self._tokens)

    @property
    def total_tokens(self) -> int:
        return len(self._tokens)

    def get_active_token(self) -> str:
        if not self._tokens:
            raise ValueError("No HuggingFace tokens found in the rotation pool.")
        with self._lock:
            return self._tokens[self._current_index]

    def rotate_to_next(self) -> int | None:
        if self.total_tokens <= 1:
            return None
        with self._lock:
            old_index = self._current_index
            self._current_index = (self._current_index + 1) % self.total_tokens
            return old_index


class Settings:
    PROJECT_NAME: str = "AI Outfit Try-On Core Engine"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    HF_TOKEN_MANAGER = HFTokenManager(os.getenv("HF_TOKENS"))


settings = Settings()