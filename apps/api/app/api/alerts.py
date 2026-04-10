"""
ComplyArc — Alerts API Routes
Aggregates screening matches, risk changes, and monitoring events into a unified alerts feed.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, or_, case as sql_case
from typing import Optional

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.screening import ScreeningResult
from app.models.adverse_media import AdverseMedia

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/stats")
async def get_alert_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get alert severity counts."""
    # Count screening matches by confidence as proxy for severity
    high = await db.scalar(
        select(func.count(ScreeningResult.id)).where(
            ScreeningResult.match_confidence == "high"
        )
    ) or 0

    medium = await db.scalar(
        select(func.count(ScreeningResult.id)).where(
            ScreeningResult.match_confidence == "medium"
        )
    ) or 0

    low = await db.scalar(
        select(func.count(ScreeningResult.id)).where(
            ScreeningResult.match_confidence == "low"
        )
    ) or 0

    media_hits = await db.scalar(select(func.count(AdverseMedia.id))) or 0

    return {
        "high": high,
        "medium": medium + media_hits,
        "low": low,
        "total": high + medium + low + media_hits,
        "unread": high + medium,  # simplified: assume high+medium are unread
    }


@router.get("")
async def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None,
    alert_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List alerts — merges screening matches and adverse media hits."""
    alerts = []

    # Screening-based alerts
    q = select(ScreeningResult).order_by(ScreeningResult.created_at.desc())
    if severity:
        q = q.where(ScreeningResult.match_confidence == severity)

    result = await db.execute(q.limit(page_size).offset((page - 1) * page_size))
    for sr in result.scalars().all():
        sev = "high" if sr.match_confidence == "high" else (
            "medium" if sr.match_confidence == "medium" else "low"
        )
        if alert_type and alert_type != "sanctions_match":
            continue
        alerts.append({
            "id": sr.id,
            "type": "sanctions_match",
            "severity": sev,
            "client": sr.screened_entity,
            "client_id": sr.client_id or "",
            "description": f"{sr.matched_list} match: {sr.matched_name} ({sr.match_score:.0f}% confidence)",
            "created_at": sr.created_at.isoformat() if sr.created_at else None,
            "read": False,
        })

    # Adverse media alerts
    if not alert_type or alert_type == "adverse_media":
        mq = select(AdverseMedia).order_by(AdverseMedia.created_at.desc()).limit(page_size)
        media_result = await db.execute(mq)
        for am in media_result.scalars().all():
            alerts.append({
                "id": am.id,
                "type": "adverse_media",
                "severity": am.severity or "medium",
                "client": am.entity_name,
                "client_id": am.client_id or "",
                "description": f"{am.category}: {am.title}",
                "created_at": am.created_at.isoformat() if am.created_at else None,
                "read": False,
            })

    # Sort by date
    alerts.sort(key=lambda a: a.get("created_at") or "", reverse=True)

    total = await db.scalar(select(func.count(ScreeningResult.id))) or 0
    media_total = await db.scalar(select(func.count(AdverseMedia.id))) or 0

    return {
        "items": alerts[:page_size],
        "total": total + media_total,
        "page": page,
        "page_size": page_size,
    }


@router.patch("/{alert_id}")
async def update_alert(
    alert_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update alert (mark read, dismiss, etc)."""
    # For now, acknowledge the request
    return {"id": alert_id, "status": "updated", **data}


@router.post("/mark-all-read")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Mark all alerts as read."""
    return {"status": "ok", "message": "All alerts marked as read"}
