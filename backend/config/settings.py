from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "MindTrack"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # Ollama Config
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b"
    OLLAMA_TIMEOUT: int = 30
    
    # Emotion Detection
    EMOTION_DETECTION_ENABLED: bool = True
    EMOTION_BUFFER_SIZE: int = 3
    NEGATIVE_EMOTIONS: str = "sad,tired"
    
    # Timer
    TIMER_UPDATE_INTERVAL: int = 1  # seconds
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def negative_emotions_list(self) -> List[str]:
        """Get negative emotions as a list"""
        return [emotion.strip() for emotion in self.NEGATIVE_EMOTIONS.split(",")]


settings = Settings()