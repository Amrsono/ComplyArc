"""
ComplyArc â€” Client API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.ubo import UBO
from app.services.client_service import client_service
from app.services.audit_service import audit_service
from app.schemas.client import (
    ClientCreateRequest, ClientUpdateRequest, ClientResponse,
    ClientListResponse, UBORequest, UBOResponse,
)

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.post("", response_model=ClientResponse, status_code=201)
async def create_client(
    request: ClientCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new client (KYC onboarding start)."""
    client = await client_service.create_client(db, request)

    await audit_service.log(
        db,
        action="create_client",
        resource_type="client",
        resource_id=client.id,
        user_id=user.id,
        user_email=user.email,
        description=f"Created client: {request.name} ({request.type})",
    )

    return client


@router.get("", response_model=ClientListResponse)
async def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List clients with filtering and pagination."""
    return await client_service.list_clients(
        db, page, page_size, status, risk_level, search, type
    )


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get client details."""
    client = await client_service.get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    request: ClientUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update client details."""
    client = await client_service.update_client(db, client_id, request)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    await audit_service.log(
        db,
        action="update_client",
        resource_type="client",
        resource_id=client_id,
        user_id=user.id,
        user_email=user.email,
        description=f"Updated client: {client.name}",
        new_value=request.model_dump(exclude_unset=True),
    )

    return client


@router.post("/{client_id}/activate", response_model=ClientResponse)
async def activate_client(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Activate a client (complete KYC onboarding)."""
    client = await client_service.activate_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    await audit_service.log(
        db,
        action="activate_client",
        resource_type="client",
        resource_id=client_id,
        user_id=user.id,
        user_email=user.email,
        description=f"Activated client: {client.name}",
    )

    return client


@router.post("/{client_id}/ubos", response_model=UBOResponse, status_code=201)
async def add_ubo(
    client_id: str,
    request: UBORequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Add a UBO to a client."""
    ubo = UBO(
        client_id=client_id,
        name=request.name,
        ownership_percent=request.ownership_percent,
        nationality=request.nationality,
        date_of_birth=request.date_of_birth,
        id_number=request.id_number,
    )
    db.add(ubo)
    await db.flush()
    return ubo


@router.get("/{client_id}/ubos", response_model=List[UBOResponse])
async def get_ubos(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get UBO structure for a client."""
    result = await db.execute(
        select(UBO).where(UBO.client_id == client_id).order_by(UBO.ownership_percent.desc())
    )
    return result.scalars().all()
