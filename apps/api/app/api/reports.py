"""
ComplyArc — Reports API Routes
Generate and list compliance reports.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from pydantic import BaseModel
import uuid

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.client import Client
from app.models.screening import ScreeningResult
from app.models.case import Case
from app.services.audit_service import audit_service

router = APIRouter(prefix="/reports", tags=["Reports"])


class ReportGenerateRequest(BaseModel):
    report_type: str  # compliance, risk, screening, media, sar, kyc, audit
    title: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None


# In-memory store for demo (in prod, this would be a DB table)
_reports_store: list[dict] = []


@router.get("")
async def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List generated reports."""
    return {
        "items": _reports_store[: page_size],
        "total": len(_reports_store),
        "page": page,
        "page_size": page_size,
    }


@router.post("/generate", status_code=201)
async def generate_report(
    request: ReportGenerateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Trigger report generation."""
    now = datetime.now(timezone.utc)

    # Gather stats for the report
    total_clients = await db.scalar(select(func.count(Client.id))) or 0
    total_screenings = await db.scalar(select(func.count(ScreeningResult.id))) or 0
    total_cases = await db.scalar(select(func.count(Case.id))) or 0

    report_id = str(uuid.uuid4())
    title = request.title or f"{request.report_type.replace('_', ' ').title()} Report — {now.strftime('%B %Y')}"

    report = {
        "id": report_id,
        "name": title,
        "type": request.report_type,
        "date": now.isoformat(),
        "status": "ready",
        "size": f"{(total_clients * 12 + total_screenings * 8 + 512) / 1024:.1f} KB",
        "generated_by": user.email,
        "summary": {
            "total_clients": total_clients,
            "total_screenings": total_screenings,
            "total_cases": total_cases,
        },
    }
    _reports_store.insert(0, report)

    await audit_service.log(
        db,
        action="generate_report",
        resource_type="report",
        resource_id=report_id,
        user_id=user.id,
        user_email=user.email,
        description=f"Generated report: {title}",
    )

    return report


@router.get("/{report_id}/download")
async def download_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Download a report file (returns JSON summary for now)."""
    report = next((r for r in _reports_store if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    from fastapi.responses import JSONResponse
    return JSONResponse(
        content={
            "report": report,
            "note": "PDF generation will be available in a future release. This is the report data.",
        },
        headers={
            "Content-Disposition": f'attachment; filename="report-{report_id[:8]}.json"',
        },
    )
