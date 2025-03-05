from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "TextProcessingService"
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    
    # Model configuration
    DEFAULT_CHUNK_SIZE: int = 2000
    DEFAULT_CHUNK_OVERLAP: int = 200
    DEFAULT_SUMMARY_LENGTH: int = 300
    
    # Service configuration
    MAX_FILE_SIZE: int = 20 * 1024 * 1024  # 20MB
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Create settings instance
settings = Settings()
