"""
ComplyArc — FastAPI Application Entry Point (Vercel Native)
"""
import logging
import sys
import os

# Ensure the root of the app is in the path so imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, BackgroundTasks
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
    logger.info("🚀 Starting ComplyArc API (Vercel Native)...")
    logger.info(f"   Environment: {settings.ENVIRONMENT}")
    
    # Create database tables
    try:
        await create_tables()
        async with async_session_factory() as session:
            await init_db(session)
            await session.commit()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.warning(f"⚠️  Database initialization deferred: {e}")

    yield
    logger.info("🛑 Shutting down ComplyArc API...")


# ——— Create Application ——————————————————————————
app = FastAPI(
    title="ComplyArc API",
    description="AI-Native AML & eKYC Operating System",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# ——— CORS Middleware ——————————————————————————————
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ——— Root Welcome ————————————————————————————————
@app.get("/", tags=["System"])
@app.get("/api", tags=["System"])
async def root():
    return {
        "message": "Welcome to ComplyArc AI-Native API",
        "status": "online",
        "documentation": "/api/docs",
        "health_check": "/api/health"
    }

# ——— Health Check ————————————————————————————————
@app.get("/api/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "ComplyArc API",
        "deploy_check": "v3_api_index"
    }

# ——— Register API Routers ————————————————————————
from app.api.auth import router as auth_router
from app.api.screening import router as screening_router
from app.api.clients import router as clients_router
from app.api.risk import router as risk_router
from app.api.cases import router as cases_router
from app.api.media import router as media_router
from app.api.dashboard import router as dashboard_router
from app.api.alerts import router as alerts_router
from app.api.monitoring_routes import router as monitoring_router
from app.api.reports import router as reports_router

app.include_router(auth_router, prefix="/api/v1")
app.include_router(screening_router, prefix="/api/v1")
app.include_router(clients_router, prefix="/api/v1")
app.include_router(risk_router, prefix="/api/v1")
app.include_router(cases_router, prefix="/api/v1")
app.include_router(media_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(alerts_router, prefix="/api/v1")
app.include_router(monitoring_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
