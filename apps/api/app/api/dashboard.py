"""
ComplyArc â€” Dashboard API Routes
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.client import Client
from app.models.screening import ScreeningResult
from app.models.adverse_media import AdverseMedia
from app.models.case import Case
from app.models.monitoring import Monitoring
from app.services.client_service import client_service
from app.services.case_service import case_service
from app.services.audit_service import audit_service
from app.schemas.dashboard import (
    DashboardResponse, DashboardStats, RiskDistribution, RecentAlert,
    AuditLogListResponse,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get comprehensive dashboard statistics."""
    # Client stats
    client_stats = await client_service.get_stats(db)

    # Case stats
    case_stats = await case_service.get_stats(db)
    cases_by_status = await case_service.get_by_status(db)

    # Screening stats
    total_screenings = await db.scalar(select(func.count(ScreeningResult.id))) or 0
    today = datetime.now(timezone.utc).date()
    screenings_today = await db.scalar(
        select(func.count(ScreeningResult.id)).where(
            func.date(ScreeningResult.created_at) == today
        )
    ) or 0

    # Adverse media
    media_hits = await db.scalar(select(func.count(AdverseMedia.id))) or 0

    # Monitoring
    monitoring_active = await db.scalar(
        select(func.count(Monitoring.id)).where(Monitoring.is_active == True)
    ) or 0

    stats = DashboardStats(
        total_clients=client_stats["total"],
        active_clients=client_stats["active"],
        high_risk_clients=client_stats["high_risk"],
        medium_risk_clients=client_stats["medium_risk"],
        low_risk_clients=client_stats["low_risk"],
        pending_clients=client_stats["pending"],
        active_cases=case_stats["active"],
        pending_review_cases=case_stats["pending_review"],
        escalated_cases=case_stats["escalated"],
        total_screenings=total_screenings,
        screenings_today=screenings_today,
        adverse_media_hits=media_hits,
        monitoring_active=monitoring_active,
    )

    risk_dist = RiskDistribution(
        high=client_stats["high_risk"],
        medium=client_stats["medium_risk"],
        low=client_stats["low_risk"],
        unscored=client_stats["total"] - client_stats["high_risk"] - client_stats["medium_risk"] - client_stats["low_risk"],
    )

    # Recent alerts (from screening results and media hits)
    recent_alerts: List[RecentAlert] = []

    # Recent high-confidence screening matches
    recent_screens = await db.execute(
        select(ScreeningResult)
        .where(ScreeningResult.match_confidence.in_(["high", "medium"]))
        .order_by(ScreeningResult.created_at.desc())
        .limit(5)
    )
    for sr in recent_screens.scalars().all():
        recent_alerts.append(RecentAlert(
            id=sr.id,
            type="sanctions_match",
            severity="high" if sr.match_confidence == "high" else "medium",
            client_name=sr.screened_entity,
            client_id=sr.client_id or "",
            description=f"{sr.matched_list} match: {sr.matched_name} ({sr.match_score:.0f}% confidence)",
            created_at=sr.created_at,
        ))

    return DashboardResponse(
        stats=stats,
        risk_distribution=risk_dist,
        recent_alerts=recent_alerts[:10],
        recent_screenings=screenings_today,
        cases_by_status=cases_by_status,
    )


@router.get("/audit-log", response_model=AuditLogListResponse)
async def get_audit_log(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get audit trail logs."""
    return await audit_service.list_logs(db, page, page_size, action, resource_type)
