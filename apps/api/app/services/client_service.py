"""
ComplyArc â€” Client Service
Client lifecycle management (CRUD + status transitions)
"""
import logging
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.models.client import Client, ClientStatus
from app.schemas.client import (
    ClientCreateRequest, ClientUpdateRequest, ClientResponse, ClientListResponse,
)

logger = logging.getLogger(__name__)


class ClientService:
    async def create_client(
        self, db: AsyncSession, request: ClientCreateRequest
    ) -> Client:
        """Create a new client."""
        client = Client(
            name=request.name,
            type=request.type,
            status=ClientStatus.PENDING,
            first_name=request.first_name,
            last_name=request.last_name,
            date_of_birth=request.date_of_birth,
            nationality=request.nationality,
            id_number=request.id_number,
            id_type=request.id_type,
            registration_number=request.registration_number,
            incorporation_country=request.incorporation_country,
            incorporation_date=request.incorporation_date,
            industry=request.industry,
            email=request.email,
            phone=request.phone,
            address=request.address,
            country=request.country,
            product_type=request.product_type,
            interface_type=request.interface_type,
            onboarding_channel=request.onboarding_channel,
            notes=request.notes,
        )
        db.add(client)
        await db.flush()
        return client

    async def get_or_create_by_name(self, db: AsyncSession, name: str) -> Client:
        """Find an existing client by name or create a shell client."""
        result = await db.execute(select(Client).where(Client.name.ilike(name)))
        client = result.scalar_one_or_none()

        if not client:
            client = Client(
                name=name,
                type="individual",  # Default for screening matches if unknown
                status=ClientStatus.PENDING,
            )
            db.add(client)
            await db.flush()
            logger.info(f"Created shell client for screening: {name}")

        return client

    async def get_client(self, db: AsyncSession, client_id: str) -> Optional[Client]:
        result = await db.execute(select(Client).where(Client.id == client_id))
        return result.scalar_one_or_none()

    async def list_clients(
        self,
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        risk_level: Optional[str] = None,
        search: Optional[str] = None,
        client_type: Optional[str] = None,
    ) -> ClientListResponse:
        """List clients with filtering and pagination."""
        query = select(Client)

        if status:
            query = query.where(Client.status == status)
        if risk_level:
            query = query.where(Client.risk_level == risk_level)
        if client_type:
            query = query.where(Client.type == client_type)
        if search:
            query = query.where(
                or_(
                    Client.name.ilike(f"%{search}%"),
                    Client.email.ilike(f"%{search}%"),
                    Client.id_number.ilike(f"%{search}%"),
                )
            )

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query) or 0

        # Paginate
        query = query.order_by(Client.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await db.execute(query)
        clients = result.scalars().all()

        return ClientListResponse(
            clients=[ClientResponse.model_validate(c) for c in clients],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def update_client(
        self, db: AsyncSession, client_id: str, request: ClientUpdateRequest
    ) -> Optional[Client]:
        client = await self.get_client(db, client_id)
        if not client:
            return None

        update_data = request.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(client, field, value)

        # Handle status transitions
        if "status" in update_data:
            if update_data["status"] == "active" and not client.onboarding_date:
                client.onboarding_date = datetime.now(timezone.utc)
            elif update_data["status"] == "closed":
                client.next_review_date = None

        await db.flush()
        return client

    async def activate_client(self, db: AsyncSession, client_id: str) -> Optional[Client]:
        """Transition client to active status."""
        client = await self.get_client(db, client_id)
        if not client:
            return None

        client.status = ClientStatus.ACTIVE
        client.onboarding_date = datetime.now(timezone.utc)
        client.next_review_date = datetime.now(timezone.utc) + timedelta(days=365)
        await db.flush()
        return client

    async def get_stats(self, db: AsyncSession) -> dict:
        """Get client statistics for dashboard."""
        total = await db.scalar(select(func.count(Client.id))) or 0
        active = await db.scalar(
            select(func.count(Client.id)).where(Client.status == "active")
        ) or 0
        high_risk = await db.scalar(
            select(func.count(Client.id)).where(Client.risk_level == "high")
        ) or 0
        medium_risk = await db.scalar(
            select(func.count(Client.id)).where(Client.risk_level == "medium")
        ) or 0
        low_risk = await db.scalar(
            select(func.count(Client.id)).where(Client.risk_level == "low")
        ) or 0
        pending = await db.scalar(
            select(func.count(Client.id)).where(Client.status == "pending")
        ) or 0

        return {
            "total": total,
            "active": active,
            "high_risk": high_risk,
            "medium_risk": medium_risk,
            "low_risk": low_risk,
            "pending": pending,
        }


client_service = ClientService()
