"""
ComplyArc â€” Database Configuration
Async SQLAlchemy engine, session factory, declarative base
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

import os

# â”€â”€â”€ Engine Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
is_vercel = os.getenv("VERCEL") == "1"
engine_kwargs = {
    "echo": settings.DEBUG,
    "pool_pre_ping": True,
}

# SQLite doesn't support pool_size/max_overflow the same way as Postgres
if "sqlite" not in settings.database_url_async:
    if is_vercel:
        # Lower pool size for serverless functions to avoid hitting connection limits
        engine_kwargs.update({
            "pool_size": 5,
            "max_overflow": 0,
            "pool_recycle": 3600,
        })
    else:
        engine_kwargs.update({
            "pool_size": 20,
            "max_overflow": 10,
        })

engine = create_async_engine(
    settings.database_url_async,
    **engine_kwargs
)

# â”€â”€â”€ Session Factory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# â”€â”€â”€ Declarative Base â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class Base(DeclarativeBase):
    pass


# â”€â”€â”€ Session Dependency â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async def get_db() -> AsyncSession:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
