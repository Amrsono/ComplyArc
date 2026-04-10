"""
Cortex AML — Client & API Key Models
KYC clients (individual/corporate) with full lifecycle management
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Text, Float, Integer, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import enum


class ClientType(str, enum.Enum):
    INDIVIDUAL = "individual"
    CORPORATE = "corporate"


class ClientStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    DORMANT = "dormant"
    SUSPENDED = "suspended"
    CLOSED = "closed"


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # ─── Identity ─────────────────────────────────
    name: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False, default=ClientType.INDIVIDUAL)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=ClientStatus.PENDING)

    # ─── Individual Fields ────────────────────────
    first_name: Mapped[str] = mapped_column(String(255), nullable=True)
    last_name: Mapped[str] = mapped_column(String(255), nullable=True)
    date_of_birth: Mapped[str] = mapped_column(String(10), nullable=True)  # YYYY-MM-DD
    nationality: Mapped[str] = mapped_column(String(3), nullable=True)  # ISO 3166-1 alpha-3
    id_number: Mapped[str] = mapped_column(String(100), nullable=True)
    id_type: Mapped[str] = mapped_column(String(50), nullable=True)  # passport, national_id, etc.

    # ─── Corporate Fields ─────────────────────────
    registration_number: Mapped[str] = mapped_column(String(100), nullable=True)
    incorporation_country: Mapped[str] = mapped_column(String(3), nullable=True)
    incorporation_date: Mapped[str] = mapped_column(String(10), nullable=True)
    industry: Mapped[str] = mapped_column(String(255), nullable=True)

    # ─── Contact ──────────────────────────────────
    email: Mapped[str] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=True)
    country: Mapped[str] = mapped_column(String(3), nullable=True)

    # ─── Risk ─────────────────────────────────────
    risk_score: Mapped[float] = mapped_column(Float, nullable=True)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=True)  # high, medium, low
    pep_status: Mapped[bool] = mapped_column(Boolean, default=False)
    sanctions_hit: Mapped[bool] = mapped_column(Boolean, default=False)

    # ─── Product/Interface Risk Inputs ────────────
    product_type: Mapped[str] = mapped_column(String(100), nullable=True)
    interface_type: Mapped[str] = mapped_column(String(50), nullable=True)  # direct, intermediary
    onboarding_channel: Mapped[str] = mapped_column(String(50), nullable=True)  # face_to_face, remote

    # ─── Metadata ─────────────────────────────────
    assigned_officer: Mapped[str] = mapped_column(String(36), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    onboarding_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    last_review_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    next_review_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class ApiKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    key_prefix: Mapped[str] = mapped_column(String(12), nullable=False)  # first 12 chars for display
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_used: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
