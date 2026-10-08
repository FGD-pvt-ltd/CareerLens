"""
Settings Configuration

Centralized configuration reading environment variables for external integrations
such as Google's Gemini API with fallback defaults and zero hardcoded secrets.
"""

import os
from pathlib import Path
from typing import Optional

# Configurable sensible default for modern Gemini API
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"


def _load_env_file() -> None:
    """
    Lightweight .env loader that populates os.environ without requiring external packages.
    Safely ignores missing files, blank lines, and comments.
    """
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.is_file():
        return

    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                # Do not overwrite if already explicitly set in environment
                if key and key not in os.environ and val:
                    os.environ[key] = val
    except Exception:
        pass


# Load local .env on initial import
_load_env_file()


def get_gemini_api_key() -> Optional[str]:
    """
    Retrieves the configured Gemini API key from environment variables.
    Returns None if empty or missing.
    """
    _load_env_file()
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    return key if key else None


def get_gemini_model() -> str:
    """
    Retrieves the configured Gemini model name from environment variables,
    falling back to DEFAULT_GEMINI_MODEL.
    """
    _load_env_file()
    model = os.environ.get("GEMINI_MODEL", "").strip()
    return model if model else DEFAULT_GEMINI_MODEL


def is_gemini_configured() -> bool:
    """Returns True if a non-empty Gemini API key is configured."""
    return bool(get_gemini_api_key())
