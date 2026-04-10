"""
Cortex AML — Cases API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.case_service import case_service
from app.services.audit_service import audit_service
from app.schemas.case import (
    CaseCreateRequest, CaseUpdateRequest, CaseResponse,
    CaseListResponse, CaseNoteRequest, CaseNoteResponse,
)

router = APIRouter(prefix="/cases", tags=["Case Management"])


@router.post("", response_model=CaseResponse, status_code=201)
async def create_case(
    request: CaseCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    case = await case_service.create_case(db, request, created_by=user.id)
    await audit_service.log(
        db, action="create_case", resource_type="case",
        resource_id=case.id, user_id=user.id, user_email=user.email,
        description=f"Created case {case.case_number}: {request.title}",
    )
    return case


@router.get("", response_model=CaseListResponse)
async def list_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    client_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await case_service.list_cases(db, page, page_size, status, priority, client_id)


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    case = await case_service.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str,
    request: CaseUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    case = await case_service.update_case(db, case_id, request)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    await audit_service.log(
        db, action="update_case", resource_type="case",
        resource_id=case_id, user_id=user.id, user_email=user.email,
        description=f"Updated case {case.case_number}",
        new_value=request.model_dump(exclude_unset=True),
    )
    return case


@router.post("/{case_id}/notes", response_model=CaseNoteResponse, status_code=201)
async def add_note(
    case_id: str,
    request: CaseNoteRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    note = await case_service.add_note(db, case_id, request, user.id)
    return note


@router.get("/{case_id}/notes", response_model=List[CaseNoteResponse])
async def get_notes(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await case_service.get_notes(db, case_id)
