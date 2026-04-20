"""
ComplyArc — Monitoring API Routes
CRUD for continuous client monitoring registrations.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from pydantic import BaseModel

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.monitoring import Monitoring
from app.models.client import Client
from app.services.audit_service import audit_service

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])


class MonitoringCreateRequest(BaseModel):
    client_id: str
    frequency: str = "daily"  # daily, weekly, monthly
    sanctions: bool = True
    pep: bool = True
    media: bool = False


class MonitoringResponse(BaseModel):
    id: str
    client_id: str
    client_name: str | None = None
    frequency: str
    sanctions: bool
    pep: bool
    media: bool
    is_active: bool
    last_screened: str | None = None
    next_review: str | None = None
    alerts_count: int = 0

    class Config:
        from_attributes = True


@router.get("")
async def list_monitoring(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all monitored clients."""
    q = select(Monitoring).order_by(Monitoring.created_at.desc())
    total = await db.scalar(select(func.count(Monitoring.id))) or 0

    result = await db.execute(q.limit(page_size).offset((page - 1) * page_size))
    items = []

    for mon in result.scalars().all():
        # Get client name
        client = await db.get(Client, mon.client_id)
        items.append({
            "id": mon.id,
            "client_id": mon.client_id,
            "client_name": client.name if client else "Unknown",
            "client_type": client.type if client else "unknown",
            "frequency": mon.frequency or "daily",
            "sanctions": mon.include_sanctions,
            "pep": mon.include_pep,
            "media": mon.include_adverse_media,
            "is_active": mon.is_active,
            "last_screened": mon.last_screened.isoformat() if mon.last_screened else None,
            "next_review": mon.next_screening.isoformat() if mon.next_screening else None,
            "alerts_count": 0,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "active_count": sum(1 for i in items if i["is_active"]),
    }


@router.post("", status_code=201)
async def register_monitoring(
    request: MonitoringCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Register a client for continuous monitoring."""
    client = await db.get(Client, request.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    mon = Monitoring(
        client_id=request.client_id,
        frequency=request.frequency,
        include_sanctions=request.sanctions,
        include_pep=request.pep,
        include_adverse_media=request.media,
        is_active=True,
    )
    db.add(mon)
    await db.flush()

    await audit_service.log(
        db,
        action="register_monitoring",
        resource_type="monitoring",
        resource_id=mon.id,
        user_id=user.id,
        user_email=user.email,
        description=f"Registered {client.name} for {request.frequency} monitoring",
    )

    return {
        "id": mon.id,
        "client_id": request.client_id,
        "client_name": client.name,
        "frequency": request.frequency,
        "is_active": True,
        "status": "registered",
    }


@router.post("/{monitoring_id}/toggle")
async def toggle_monitoring(
    monitoring_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Pause or resume monitoring."""
    mon = await db.get(Monitoring, monitoring_id)
    if not mon:
        raise HTTPException(status_code=404, detail="Monitoring entry not found")

    mon.is_active = not mon.is_active
    await db.flush()

    return {
        "id": monitoring_id,
        "is_active": mon.is_active,
        "status": "active" if mon.is_active else "paused",
    }


@router.delete("/{monitoring_id}")
async def delete_monitoring(
    monitoring_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Remove client from monitoring."""
    mon = await db.get(Monitoring, monitoring_id)
    if not mon:
        raise HTTPException(status_code=404, detail="Monitoring entry not found")

    await db.delete(mon)
    await db.flush()
    return {"status": "deleted", "id": monitoring_id}
