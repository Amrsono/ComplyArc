"""
Cortex AML — Screening Result Model
Stores screening matches against sanctions/PEP/internal lists
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Float, ForeignKey, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
import enum


class ListType(str, enum.Enum):
    OFAC = "OFAC"
    EU = "EU"
    UN = "UN"
    UK = "UK"
    PEP = "PEP"
    INTERNAL = "INTERNAL"


class MatchDecision(str, enum.Enum):
    PENDING = "pending"
    TRUE_POSITIVE = "true_positive"
    FALSE_POSITIVE = "false_positive"
    ESCALATED = "escalated"


class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # ─── What was screened ────────────────────────
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id"), nullable=True, index=True
    )
    screened_entity: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    screened_type: Mapped[str] = mapped_column(String(20), nullable=True)  # individual / corporate

    # ─── Match Details ────────────────────────────
    matched_name: Mapped[str] = mapped_column(String(500), nullable=False)
    matched_list: Mapped[str] = mapped_column(String(20), nullable=False)  # OFAC, EU, UN, UK, PEP
    matched_entry_id: Mapped[str] = mapped_column(String(100), nullable=True)
    match_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100
    match_confidence: Mapped[str] = mapped_column(String(20), nullable=False)  # high, medium, low

    # ─── Match Explanation ────────────────────────
    name_similarity: Mapped[float] = mapped_column(Float, nullable=True)
    dob_match: Mapped[bool] = mapped_column(Boolean, nullable=True)
    nationality_match: Mapped[bool] = mapped_column(Boolean, nullable=True)
    explanation: Mapped[str] = mapped_column(Text, nullable=True)
    ai_summary: Mapped[str] = mapped_column(Text, nullable=True)

    # ─── Decision ─────────────────────────────────
    decision: Mapped[str] = mapped_column(String(20), default=MatchDecision.PENDING)
    decided_by: Mapped[str] = mapped_column(String(36), nullable=True)
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    decision_notes: Mapped[str] = mapped_column(Text, nullable=True)

    # ─── Metadata ─────────────────────────────────
    screened_by: Mapped[str] = mapped_column(String(36), nullable=True)  # user_id or 'api'
    screening_type: Mapped[str] = mapped_column(String(20), default="manual")  # manual, api, monitoring
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
