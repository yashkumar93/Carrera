"""
Application configuration using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import List, Literal


class Settings(BaseSettings):
    # Gemini API
    gemini_api_key: str = ""

    # Firebase
    firebase_credentials_path: str = "../firebase-service-account.json"

    # CORS
    cors_origins_str: str = "http://localhost:3000,http://localhost:3001"

    # Environment
    environment: Literal["development", "production"] = "development"

    # Rate limiting
    rate_limit_chat: str = "20/minute"
    rate_limit_default: str = "60/minute"

    # Input validation
    max_message_length: int = 5000

    # Gemini model
    gemini_model: str = "gemini-2.0-flash"

    # Context window (number of recent messages to include)
    context_window_size: int = 20

    # Pagination
    max_sessions_per_page: int = 20

    # Pinecone (community insights vector DB)
    pinecone_api_key: str = ""
    pinecone_index_name: str = "career-insights"
    pinecone_namespace: str = ""  # Optional — leave empty if you don't use namespaces
    # Embedding model used to upsert the Pinecone index. Query-time
    # embeddings MUST use the same model/dims for cosine similarity to work.
    # Your redditdata index was loaded with sentence-transformers all-MiniLM-L6-v2 (384-dim).
    pinecone_embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins_str.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
