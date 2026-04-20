"""
ComplyArc â€” Audit Service
Immutable audit trail logging for compliance
"""
import json
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.audit_log import AuditLog
from app.schemas.dashboard import AuditLogResponse, AuditLogListResponse


class AuditService:
    async def log(
        self,
        db: AsyncSession,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        description: Optional[str] = None,
        old_value: Optional[dict] = None,
        new_value: Optional[dict] = None,
        ip_address: Optional[str] = None,
        metadata: Optional[dict] = None,
    ):
        """Create an immutable audit log entry."""
        entry = AuditLog(
            user_id=user_id,
            user_email=user_email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            description=description,
            old_value=json.dumps(old_value) if old_value else None,
            new_value=json.dumps(new_value) if new_value else None,
            ip_address=ip_address,
            metadata=json.dumps(metadata) if metadata else None,
        )
        db.add(entry)
        await db.flush()
        return entry

    async def list_logs(
        self,
        db: AsyncSession,
        page: int = 1,
        page_size: int = 50,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> AuditLogListResponse:
        query = select(AuditLog)
        if action:
            query = query.where(AuditLog.action == action)
        if resource_type:
            query = query.where(AuditLog.resource_type == resource_type)
        if user_id:
            query = query.where(AuditLog.user_id == user_id)

        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query) or 0

        query = query.order_by(AuditLog.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await db.execute(query)
        logs = result.scalars().all()

        return AuditLogListResponse(
            items=[AuditLogResponse.model_validate(l) for l in logs],
            total=total,
            page=page,
            page_size=page_size,
        )


audit_service = AuditService()
