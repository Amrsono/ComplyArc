"""
Cortex AML — Case Management Service
Alert → investigation → resolution workflow
"""
import logging
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.case import Case, CaseNote, CaseStatus
from app.schemas.case import (
    CaseCreateRequest, CaseUpdateRequest, CaseResponse,
    CaseListResponse, CaseNoteRequest, CaseNoteResponse,
)

logger = logging.getLogger(__name__)


class CaseService:
    async def _generate_case_number(self, db: AsyncSession) -> str:
        """Generate sequential case number like CX-2024-00001."""
        year = datetime.now().year
        count = await db.scalar(
            select(func.count(Case.id)).where(
                Case.case_number.like(f"CX-{year}-%")
            )
        ) or 0
        return f"CX-{year}-{str(count + 1).zfill(5)}"

    async def create_case(
        self, db: AsyncSession, request: CaseCreateRequest, created_by: Optional[str] = None
    ) -> Case:
        case_number = await self._generate_case_number(db)
        case = Case(
            case_number=case_number,
            client_id=request.client_id,
            title=request.title,
            description=request.description,
            case_type=request.case_type,
            priority=request.priority,
            assigned_to=request.assigned_to,
            screening_result_id=request.screening_result_id,
            adverse_media_id=request.adverse_media_id,
            created_by=created_by,
            status=CaseStatus.OPEN,
        )
        db.add(case)
        await db.flush()
        return case

    async def get_case(self, db: AsyncSession, case_id: str) -> Optional[Case]:
        result = await db.execute(select(Case).where(Case.id == case_id))
        return result.scalar_one_or_none()

    async def list_cases(
        self,
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        client_id: Optional[str] = None,
        assigned_to: Optional[str] = None,
    ) -> CaseListResponse:
        query = select(Case)
        if status:
            query = query.where(Case.status == status)
        if priority:
            query = query.where(Case.priority == priority)
        if client_id:
            query = query.where(Case.client_id == client_id)
        if assigned_to:
            query = query.where(Case.assigned_to == assigned_to)

        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query) or 0

        query = query.order_by(Case.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await db.execute(query)
        cases = result.scalars().all()

        return CaseListResponse(
            cases=[CaseResponse.model_validate(c) for c in cases],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def update_case(
        self, db: AsyncSession, case_id: str, request: CaseUpdateRequest
    ) -> Optional[Case]:
        case = await self.get_case(db, case_id)
        if not case:
            return None

        update_data = request.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(case, field, value)

        if "status" in update_data and update_data["status"] in ("closed", "reported"):
            case.closed_at = datetime.now(timezone.utc)

        await db.flush()
        return case

    async def add_note(
        self, db: AsyncSession, case_id: str, request: CaseNoteRequest, author_id: str
    ) -> CaseNote:
        note = CaseNote(
            case_id=case_id,
            author_id=author_id,
            content=request.content,
            note_type=request.note_type,
        )
        db.add(note)
        await db.flush()
        return note

    async def get_notes(self, db: AsyncSession, case_id: str):
        result = await db.execute(
            select(CaseNote)
            .where(CaseNote.case_id == case_id)
            .order_by(CaseNote.created_at.desc())
        )
        return result.scalars().all()

    async def get_stats(self, db: AsyncSession) -> dict:
        active = await db.scalar(
            select(func.count(Case.id)).where(Case.status.in_(["open", "under_review"]))
        ) or 0
        pending = await db.scalar(
            select(func.count(Case.id)).where(Case.status == "under_review")
        ) or 0
        escalated = await db.scalar(
            select(func.count(Case.id)).where(Case.status == "escalated")
        ) or 0
        return {"active": active, "pending_review": pending, "escalated": escalated}

    async def get_by_status(self, db: AsyncSession) -> dict:
        """Get case counts grouped by status."""
        result = {}
        for status in CaseStatus:
            count = await db.scalar(
                select(func.count(Case.id)).where(Case.status == status.value)
            ) or 0
            result[status.value] = count
        return result


case_service = CaseService()
