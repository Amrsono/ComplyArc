"""
ComplyArc â€” FastAPI Application Entry Point
"""
import logging
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
    logger.info("ðŸš€ Starting ComplyArc API...")
    logger.info(f"   Environment: {settings.ENVIRONMENT}")
    logger.info(f"   Version: {settings.APP_VERSION}")
    logger.info(f"   Database URL: {settings.DATABASE_URL[:30]}...")

    # Create database tables (resilient â€” don't crash if DB isn't ready)
    try:
        await create_tables()
        async with async_session_factory() as session:
            await init_db(session)
            await session.commit()
        logger.info("âœ… Database initialized successfully")
    except Exception as e:
        logger.warning(f"âš ï¸  Database initialization deferred: {e}")
        logger.warning("   The API will start without DB â€” retry on first request")

    # Security verification
    if not settings.is_secret_key_secure:
        logger.warning("🚨 [SECURITY WARNING] Default SECRET_KEY in use! Change this for production.")

    logger.info("✅ ComplyArc API ready")
    yield
    logger.info("ðŸ›‘ Shutting down ComplyArc API...")


# â”€â”€â”€ Create Application â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app = FastAPI(
    title="ComplyArc API",
    description="AI-Native AML & eKYC Operating System â€” Sanctions Screening, PEP Detection, Adverse Media AI, Risk Scoring Engine",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# â”€â”€â”€ CORS Middleware â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# â”€â”€â”€ Security Headers Middleware â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# â”€â”€â”€ Global Exception Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    
    # Extract error details
    error_type = type(exc).__name__
    error_detail = str(exc)
    
    # Special handling for SQLAlchemy errors to provide cleaner messages
    if "StringDataRightTruncationError" in error_type or "DataError" in error_type:
        error_detail = "Data value too long for database column. Please check field lengths."
    
    # Manually add CORS headers if available, otherwise browser reports 'Failed to fetch'
    headers = {}
    origin = request.headers.get("origin")
    
    # If settings.CORS_ORIGINS is ["*"], we can allow any origin
    if "*" in settings.cors_origins_list:
        headers["Access-Control-Allow-Origin"] = origin or "*"
        headers["Access-Control-Allow-Credentials"] = "true"
    elif origin and origin in settings.cors_origins_list:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    # Always include these for transparency during debugging
    headers["Access-Control-Allow-Methods"] = "*"
    headers["Access-Control-Allow-Headers"] = "*"

    return JSONResponse(
        status_code=500,
        content={
            "detail": error_detail,
            "type": error_type,
            "path": request.url.path,
        },
        headers=headers
    )


# â”€â”€â”€ Register API Routers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
from app.api.auth import router as auth_router
from app.core.deps import require_role
from app.models.user import User
from fastapi import Depends
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


# â”€â”€â”€ Health Check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "ComplyArc API",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "deploy_check": "v2_direct_bcrypt"
    }


# â”€â”€â”€ Sanctions Data Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async def run_sanctions_ingestion():
    """Background task for ingestion."""
    from app.services.sanctions_ingestor import sanctions_ingestor
    from app.db.base import async_session_factory
    
    logger.info("âš«ï¸   Background sanctions ingestion started...")
    try:
        async with async_session_factory() as db:
            stats = await sanctions_ingestor.ingest_all(db)
            await db.commit()
            logger.info(f"âœ… Background ingestion completed: {stats}")
    except Exception as e:
        logger.error(f"â Œ Background ingestion failed: {e}", exc_info=True)

@app.post("/api/v1/admin/ingest-sanctions", tags=["Admin"], status_code=202)
async def ingest_sanctions(
    background_tasks: BackgroundTasks,
    admin_user: User = Depends(require_role("admin")),
):
    """Trigger sanctions list ingestion (admin only, runs in background)."""
    background_tasks.add_task(run_sanctions_ingestion)
    return {"message": "Synchronization started in background"}
