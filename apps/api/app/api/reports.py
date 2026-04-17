"""
ComplyArc — Reports API Routes
Generate and list compliance reports.
"""
from datetime import datetime, timezone
import os
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
from app.models.report import Report
from app.services.audit_service import audit_service

router = APIRouter(prefix="/reports", tags=["Reports"])

class ReportGenerateRequest(BaseModel):
    report_type: str  # compliance, risk, screening, media, sar, kyc, audit
    title: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None

@router.get("")
async def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List generated reports."""
    q = select(Report).order_by(Report.created_at.desc())
    total = await db.scalar(select(func.count(Report.id))) or 0
    
    result = await db.execute(q.limit(page_size).offset((page - 1) * page_size))
    items = result.scalars().all()

    return {
        "items": [{
            "id": r.id,
            "name": r.name,
            "type": r.type,
            "date": r.created_at.isoformat() if r.created_at else None,
            "status": r.status,
            "size": r.size,
            "generated_by": r.generated_by,
        } for r in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/generate", status_code=201)
async def generate_report(
    request: ReportGenerateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Trigger report generation to create a real CSV file."""
    import pandas as pd
    now = datetime.now(timezone.utc)

    title = request.title or f"{request.report_type.replace('_', ' ').title()} Report — {now.strftime('%B %Y')}"
    report_id = str(uuid.uuid4())

    # Build the report data payload based on DB entries
    report_data = []
    
    # Example generic payload extraction for CSV based on active clients
    clients_res = await db.execute(select(Client))
    clients = clients_res.scalars().all()
    
    for c in clients:
        report_data.append({
            "Client ID": c.id,
            "Name": c.name,
            "Type": c.type,
            "Country": c.country,
            "Risk Level": c.risk_level,
            "Risk Score": c.risk_score,
            "Status": c.status,
            "Onboarding Channel": getattr(c, "onboarding_channel", "N/A"),
        })

    # Convert to pandas DataFrame and save
    df = pd.DataFrame(report_data)
    
    # Ensure reports directory exists
    reports_dir = "data/reports"
    os.makedirs(reports_dir, exist_ok=True)
    
    file_path = os.path.join(reports_dir, f"report_{report_id}.csv")
    df.to_csv(file_path, index=False)
    file_size = os.path.getsize(file_path)
    file_size_kb = f"{file_size / 1024:.1f} KB"

    # Save to db
    report = Report(
        id=report_id,
        name=title,
        type=request.report_type,
        status="ready",
        size=file_size_kb,
        generated_by=user.email,
        file_path=file_path
    )
    db.add(report)
    await db.flush()

    await audit_service.log(
        db,
        action="generate_report",
        resource_type="report",
        resource_id=report.id,
        user_id=user.id,
        user_email=user.email,
        description=f"Generated and saved real CSV report: {title}",
    )

    return {
        "id": report.id,
        "name": report.name,
        "type": report.type,
        "date": report.created_at.isoformat() if report.created_at else None,
        "status": report.status,
        "size": report.size,
        "generated_by": report.generated_by,
        "summary": {
            "total_clients_in_report": len(report_data),
        },
    }


@router.get("/{report_id}/download")
async def download_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Download the actual CSV report file."""
    report = await db.get(Report, report_id)
    if not report or not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found")

    from fastapi.responses import FileResponse
    return FileResponse(
        path=report.file_path,
        filename=f"{report.name.replace(' ', '_')}.csv",
        media_type="text/csv"
    )
