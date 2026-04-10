"""
ComplyArc â€” Screening API Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.core.deps import get_current_user, validate_api_key
from app.models.user import User
from app.services.screening_service import screening_service
from app.services.audit_service import audit_service
from app.schemas.screening import ScreenRequest, ScreenResponse, BatchScreenRequest, BatchScreenResponse

router = APIRouter(prefix="/screen", tags=["Screening"])


@router.post("", response_model=ScreenResponse)
async def screen_entity(
    request: ScreenRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Screen an entity against sanctions, PEP, and watchlists.
    
    Returns matches with confidence scores and explanations.
    """
    result = await screening_service.screen_entity(
        db, request, screened_by=user.id, screening_type="manual"
    )

    await audit_service.log(
        db,
        action="screen_entity",
        resource_type="screening",
        resource_id=result.screening_id,
        user_id=user.id,
        user_email=user.email,
        description=f"Screened entity: {request.name} â€” {result.total_matches} matches, risk: {result.overall_risk}",
    )

    return result


@router.post("/api", response_model=ScreenResponse)
async def screen_entity_api(
    request: ScreenRequest,
    db: AsyncSession = Depends(get_db),
    api_key=Depends(validate_api_key),
):
    """Screen entity via API key (for external integrations)."""
    result = await screening_service.screen_entity(
        db, request, screened_by=f"api:{api_key.id}", screening_type="api"
    )

    await audit_service.log(
        db,
        action="screen_entity_api",
        resource_type="screening",
        resource_id=result.screening_id,
        api_key_id=api_key.id,
        description=f"API screening: {request.name} â€” {result.total_matches} matches",
    )

    return result


@router.post("/batch", response_model=BatchScreenResponse)
async def batch_screen(
    request: BatchScreenRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Screen multiple entities in batch."""
    result = await screening_service.batch_screen(db, request, screened_by=user.id)

    await audit_service.log(
        db,
        action="batch_screen",
        resource_type="screening",
        user_id=user.id,
        user_email=user.email,
        description=f"Batch screening: {result.total_entities} entities, {result.total_matches} matches",
    )

    return result
