import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartExam AI"
    VERSION: str = "1.2.0"
    API_V1_STR: str = "/api"
    
    SECRET_KEY: str = os.getenv("JWT_SECRET", "super-secret-key-for-development-only-change-in-production")
    ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smartexam.db")
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://smartexam-ai.vercel.app",
        "*"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
