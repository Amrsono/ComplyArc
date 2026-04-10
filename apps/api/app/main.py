"""
Cortex AML — FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.base import async_session_factory
from app.db.init_db import create_tables, init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    logger.info("🚀 Starting Cortex AML API...")
    logger.info(f"   Environment: {settings.ENVIRONMENT}")
    logger.info(f"   Version: {settings.APP_VERSION}")
    logger.info(f"   Database URL: {settings.DATABASE_URL[:30]}...")

    # Create database tables (resilient — don't crash if DB isn't ready)
    try:
        await create_tables()
        async with async_session_factory() as session:
            await init_db(session)
            await session.commit()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.warning(f"⚠️  Database initialization deferred: {e}")
        logger.warning("   The API will start without DB — retry on first request")

    logger.info("✅ Cortex AML API ready")
    yield
    logger.info("🛑 Shutting down Cortex AML API...")


# ─── Create Application ──────────────────────────
app = FastAPI(
    title="Cortex AML API",
    description="AI-Native AML & eKYC Operating System — Sanctions Screening, PEP Detection, Adverse Media AI, Risk Scoring Engine",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS Middleware ──────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Global Exception Handler ────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": str(type(exc).__name__)},
    )


# ─── Register API Routers ────────────────────────
from app.api.auth import router as auth_router
from app.api.screening import router as screening_router
from app.api.clients import router as clients_router
from app.api.risk import router as risk_router
from app.api.cases import router as cases_router
from app.api.media import router as media_router
from app.api.dashboard import router as dashboard_router

app.include_router(auth_router, prefix="/api/v1")
app.include_router(screening_router, prefix="/api/v1")
app.include_router(clients_router, prefix="/api/v1")
app.include_router(risk_router, prefix="/api/v1")
app.include_router(cases_router, prefix="/api/v1")
app.include_router(media_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")


# ─── Health Check ─────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "Cortex AML API",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


# ─── Sanctions Data Management ────────────────────
@app.post("/api/v1/admin/ingest-sanctions", tags=["Admin"])
async def ingest_sanctions(request: Request):
    """Trigger sanctions list ingestion (admin only)."""
    from app.services.sanctions_ingestor import sanctions_ingestor
    from app.db.base import get_db

    async with async_session_factory() as db:
        stats = await sanctions_ingestor.ingest_all(db)
        await db.commit()

    return {"status": "completed", "stats": stats}
