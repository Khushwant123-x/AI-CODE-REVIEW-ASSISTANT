"""
Application configuration using Pydantic Settings.
All values come from environment variables or .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # GitHub
    github_token: str = ""

    # Groq
    groq_api_key: str = ""
    groq_model: str = "llama3-70b-8192"

    # Chunking
    max_chunk_lines: int = 300

    # CORS
    allowed_origins: list[str] = [
        "*",
        "http://localhost:5173",
        "http://localhost:3000",
        "https://frontend-agrotech2.vercel.app",
        "https://frontend-lovat-three-81.vercel.app",
    ]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
