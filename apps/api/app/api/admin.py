"""
ComplyArc — Admin API Routes
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks

from app.db.base import get_db, async_session_factory
from app.models.user import User
from app.core.deps import get_current_user
from app.services.sanctions_ingestor import sanctions_ingestor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])


async def sync_watchlists_background():
    """Background task to safely run sanctions ingestion."""
    logger.info("Starting global watchlist background sync...")
    async with async_session_factory() as db:
        try:
            stats = await sanctions_ingestor.ingest_all(db)
            await db.commit()
            logger.info(f"Global watchlist background sync completed successfully. Stats: {stats}")
        except Exception as e:
            await db.rollback()
            logger.error(f"Global watchlist background sync failed: {e}", exc_info=True)


@router.post("/ingest-sanctions")
async def run_ingest_sanctions(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """Trigger manual ingestion/syncing of global watchlists (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can trigger global watchlist synchronization.",
        )
    
    background_tasks.add_task(sync_watchlists_background)
    return {
        "status": "success",
        "message": "Watchlist synchronization started in the background."
    }
