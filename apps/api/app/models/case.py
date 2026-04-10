"""
Cortex AML — Case Management Model
Alert → investigation → resolution workflow
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
import enum


class CaseStatus(str, enum.Enum):
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    ESCALATED = "escalated"
    CLOSED = "closed"
    REPORTED = "reported"  # Filed with regulator


class CasePriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    case_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id"), nullable=False, index=True
    )

    # ─── Case Details ─────────────────────────────
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    case_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # sanctions_match, pep_match, adverse_media, risk_escalation, monitoring_alert
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=CaseStatus.OPEN)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default=CasePriority.MEDIUM)

    # ─── Assignment ───────────────────────────────
    assigned_to: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    escalated_to: Mapped[str] = mapped_column(String(36), nullable=True)

    # ─── Resolution ───────────────────────────────
    resolution: Mapped[str] = mapped_column(Text, nullable=True)
    sar_filed: Mapped[bool] = mapped_column(default=False)  # Suspicious Activity Report
    sar_reference: Mapped[str] = mapped_column(String(100), nullable=True)

    # ─── Linked Records ──────────────────────────
    screening_result_id: Mapped[str] = mapped_column(String(36), nullable=True)
    adverse_media_id: Mapped[str] = mapped_column(String(36), nullable=True)

    # ─── Metadata ─────────────────────────────────
    created_by: Mapped[str] = mapped_column(String(36), nullable=True)
    closed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class CaseNote(Base):
    __tablename__ = "case_notes"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id"), nullable=False, index=True
    )
    author_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    note_type: Mapped[str] = mapped_column(
        String(20), default="comment"
    )  # comment, status_change, escalation, attachment
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
