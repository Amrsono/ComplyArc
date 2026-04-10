"""
ComplyArc â€” Monitoring Model
Continuous screening configuration
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Monitoring(Base):
    __tablename__ = "monitoring"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id"), nullable=False, unique=True, index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    frequency: Mapped[str] = mapped_column(
        String(20), default="daily"
    )  # daily, weekly, monthly
    include_sanctions: Mapped[bool] = mapped_column(Boolean, default=True)
    include_pep: Mapped[bool] = mapped_column(Boolean, default=True)
    include_adverse_media: Mapped[bool] = mapped_column(Boolean, default=True)
    alert_count: Mapped[int] = mapped_column(Integer, default=0)
    last_screened: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    next_screening: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
