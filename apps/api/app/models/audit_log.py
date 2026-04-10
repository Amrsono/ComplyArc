"""
ComplyArc â€” Audit Log Model
Immutable compliance audit trail
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # â”€â”€â”€ Who â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    user_id: Mapped[str] = mapped_column(String(36), nullable=True, index=True)
    user_email: Mapped[str] = mapped_column(String(255), nullable=True)
    api_key_id: Mapped[str] = mapped_column(String(36), nullable=True)

    # â”€â”€â”€ What â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    action: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )  # screen, kyc_onboard, risk_calculate, case_create, etc.
    resource_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # client, screening, case, risk_score, etc.
    resource_id: Mapped[str] = mapped_column(String(36), nullable=True)

    # â”€â”€â”€ Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    description: Mapped[str] = mapped_column(Text, nullable=True)
    old_value: Mapped[str] = mapped_column(Text, nullable=True)  # JSON
    new_value: Mapped[str] = mapped_column(Text, nullable=True)  # JSON
    extra_metadata: Mapped[str] = mapped_column(Text, nullable=True)  # JSON â€” extra context

    # â”€â”€â”€ Context â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str] = mapped_column(String(500), nullable=True)

    # â”€â”€â”€ Timestamp (immutable) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
