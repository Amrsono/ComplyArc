"""
Cortex AML — Database Configuration
Async SQLAlchemy engine, session factory, declarative base
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# ─── Async Engine ─────────────────────────────────
engine = create_async_engine(
    settings.database_url_async,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

# ─── Session Factory ─────────────────────────────
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ─── Declarative Base ────────────────────────────
class Base(DeclarativeBase):
    pass


# ─── Session Dependency ──────────────────────────
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
