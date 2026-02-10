"""
Application configuration using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Gemini API
    gemini_api_key: str = ""
    
    # Firebase
    firebase_credentials_path: str = "../firebase-service-account.json"
    
    # CORS
    cors_origins_str: str = "http://localhost:3000,http://localhost:3001"
    
    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins_str.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
