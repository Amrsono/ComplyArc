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


@router.get("/risk-analytics")
async def get_risk_analytics(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get aggregated risk analytics for charts."""
    from app.models.risk_score import RiskScore

    # Risk distribution
    client_stats = await client_service.get_stats(db)

    # Risk by country — aggregate clients by country
    country_q = await db.execute(
        select(
            Client.country,
            func.count(Client.id).label("clients"),
            func.avg(Client.risk_score_total).label("avg_risk"),
        )
        .where(Client.country.isnot(None))
        .group_by(Client.country)
        .order_by(func.count(Client.id).desc())
        .limit(10)
    )
    risk_by_country = [
        {
            "country": row.country or "Unknown",
            "clients": row.clients,
            "avg_risk": round(float(row.avg_risk or 0), 1),
        }
        for row in country_q.all()
    ]

    # Product risk — group by industry
    industry_q = await db.execute(
        select(
            Client.industry,
            func.avg(Client.risk_score_total).label("avg_risk"),
            func.count(Client.id).label("clients"),
        )
        .where(Client.industry.isnot(None))
        .group_by(Client.industry)
        .order_by(func.avg(Client.risk_score_total).desc())
        .limit(8)
    )
    product_risk = [
        {
            "product": row.industry or "Other",
            "risk": round(float(row.avg_risk or 0), 1),
            "clients": row.clients,
        }
        for row in industry_q.all()
    ]

    # Risk factor averages from latest scores
    factor_q = await db.execute(
        select(
            func.avg(RiskScore.client_risk).label("client_avg"),
            func.avg(RiskScore.geography_risk).label("geo_avg"),
            func.avg(RiskScore.product_risk).label("product_avg"),
            func.avg(RiskScore.interface_risk).label("interface_avg"),
        )
    )
    factors_row = factor_q.one_or_none()
    risk_factor_avg = [
        {"factor": "Client Risk", "avg": round(float(factors_row.client_avg or 0), 1)},
        {"factor": "Geography Risk", "avg": round(float(factors_row.geo_avg or 0), 1)},
        {"factor": "Product Risk", "avg": round(float(factors_row.product_avg or 0), 1)},
        {"factor": "Interface Risk", "avg": round(float(factors_row.interface_avg or 0), 1)},
    ] if factors_row else []

    return {
        "risk_distribution": {
            "high": client_stats["high_risk"],
            "medium": client_stats["medium_risk"],
            "low": client_stats["low_risk"],
        },
        "risk_by_country": risk_by_country,
        "product_risk": product_risk,
        "risk_factor_avg": risk_factor_avg,
        "summary": {
            "total_clients": client_stats["total"],
            "high_risk_pct": round(client_stats["high_risk"] / max(client_stats["total"], 1) * 100, 1),
            "avg_portfolio_risk": round(
                sum(f["avg"] for f in risk_factor_avg) / max(len(risk_factor_avg), 1), 1
            ) if risk_factor_avg else 0,
            "countries": len(risk_by_country),
        },
    }
