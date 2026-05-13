"""
ComplyArc â€” Core Configuration
Typed settings via Pydantic BaseSettings
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # â”€â”€â”€ Application â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    APP_NAME: str = "ComplyArc"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000

    # â”€â”€â”€ Database â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # Supports Vercel Postgres (POSTGRES_URL) and generic DATABASE_URL
    DATABASE_URL: str = "sqlite+aiosqlite:///./complyarc.db"
    
    @property
    def effective_database_url(self) -> str:
        """Priority: POSTGRES_URL (Vercel) > DATABASE_URL > Default."""
        # Note: Pydantic BaseSettings can also be configured to handle this via Field(validation_alias=...)
        # but manual property is very explicit for various hosting providers.
        return os.getenv("POSTGRES_URL") or self.DATABASE_URL

    @property
    def database_url_async(self) -> str:
        """Convert postgres:// to postgresql+asyncpg:// and ensure SSL for production."""
        url = self.effective_database_url
        
        # 1. Driver conversion
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            
        # 2. SSL Enforcement for production (Vercel/Neon require this)
        if "postgresql" in url and ("production" in self.ENVIRONMENT.lower() or "vercel" in os.getenv("VERCEL", "").lower()):
            if "sslmode" not in url and "ssl" not in url:
                separator = "&" if "?" in url else "?"
                url = f"{url}{separator}sslmode=require"
                
        return url

    @property
    def database_url_sync_computed(self) -> str:
        """Convert to postgresql:// for Alembic / sync drivers and ensure SSL."""
        url = self.effective_database_url
        
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        elif url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
            
        # SSL for sync drivers too
        if "postgresql" in url and ("production" in self.ENVIRONMENT.lower() or "vercel" in os.getenv("VERCEL", "").lower()):
            if "sslmode" not in url and "ssl" not in url:
                separator = "&" if "?" in url else "?"
                url = f"{url}{separator}sslmode=require"
                
        return url

    # â”€â”€â”€ Redis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    REDIS_URL: str = "redis://localhost:6379/0"

    # â”€â”€â”€ Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    SECRET_KEY: str = "complyarc-dev-secret-key-change-me-in-production"
    
    @property
    def is_secret_key_secure(self) -> bool:
        """Check if SECRET_KEY has been changed from default."""
        return self.SECRET_KEY != "complyarc-dev-secret-key-change-me-in-production"

    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours
    API_KEY_HEADER: str = "X-API-Key"

    # â”€â”€â”€ CORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,*"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # â”€â”€â”€ OpenAI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # â”€â”€â”€ News API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    NEWS_API_KEY: str = ""

    # â”€â”€â”€ Sanctions Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    OFAC_SDN_URL: str = "https://www.treasury.gov/ofac/downloads/sdn.xml"
    EU_SANCTIONS_URL: str = "https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw"
    UN_SANCTIONS_URL: str = "https://scsanctions.un.org/resources/xml/en/consolidated.xml"
    UK_SANCTIONS_URL: str = "https://assets.publishing.service.gov.uk/media/65a8a29f867c2b000d6e8e19/UK_Sanctions_List.ods"

    # â”€â”€â”€ Screening Thresholds â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    MATCH_THRESHOLD_HIGH: float = 85.0
    MATCH_THRESHOLD_MEDIUM: float = 70.0
    MATCH_THRESHOLD_LOW: float = 50.0

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
