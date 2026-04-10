"""
Cortex AML — UBO (Ultimate Beneficial Owner) Model
Ownership structure tracking for corporate clients
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class UBO(Base):
    __tablename__ = "ubos"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    ownership_percent: Mapped[float] = mapped_column(Float, nullable=False)
    nationality: Mapped[str] = mapped_column(String(3), nullable=True)
    date_of_birth: Mapped[str] = mapped_column(String(10), nullable=True)
    id_number: Mapped[str] = mapped_column(String(100), nullable=True)
    pep_status: Mapped[bool] = mapped_column(Boolean, default=False)
    sanctions_hit: Mapped[bool] = mapped_column(Boolean, default=False)
    risk_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    risk_notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
