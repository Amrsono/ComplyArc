"""
ComplyArc â€” Media API Routes
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.adverse_media_service import adverse_media_service
from app.services.audit_service import audit_service
from app.schemas.media import MediaSearchRequest, MediaSearchResponse

router = APIRouter(prefix="/media", tags=["Adverse Media"])


@router.post("/search", response_model=MediaSearchResponse)
async def search_media(
    request: MediaSearchRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Search for adverse media about an entity.
    
    Uses AI to classify articles by risk category and severity.
    """
    result = await adverse_media_service.search_media(db, request)

    await audit_service.log(
        db,
        action="search_media",
        resource_type="adverse_media",
        user_id=user.id,
        user_email=user.email,
        description=f"Adverse media search: {request.entity_name} â€” {result.total_hits} hits",
    )

    return result
