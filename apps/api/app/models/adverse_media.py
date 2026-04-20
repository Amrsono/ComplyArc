"""
ComplyArc â€” Adverse Media Model
News articles linked to clients with AI-powered classification
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class AdverseMedia(Base):
    __tablename__ = "adverse_media"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id"), nullable=True, index=True
    )

    # â”€â”€â”€ Article Info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    entity_name: Mapped[str] = mapped_column(String(1000), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(1000), nullable=True)
    source: Mapped[str] = mapped_column(String(1000), nullable=True)
    source_url: Mapped[str] = mapped_column(Text, nullable=True)
    published_date: Mapped[str] = mapped_column(String(50), nullable=True)
    snippet: Mapped[str] = mapped_column(Text, nullable=True)

    # â”€â”€â”€ AI Classification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    category: Mapped[str] = mapped_column(
        String(255), nullable=True
    )  # fraud, corruption, terrorism, money_laundering, sanctions_evasion, other
    severity: Mapped[str] = mapped_column(String(255), nullable=True)  # low, medium, high, critical
    relevance_score: Mapped[float] = mapped_column(Float, nullable=True)  # 0-100
    confidence_score: Mapped[float] = mapped_column(Float, nullable=True)  # 0-100

    # â”€â”€â”€ AI Analysis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    ai_summary: Mapped[str] = mapped_column(Text, nullable=True)
    risk_impact: Mapped[str] = mapped_column(Text, nullable=True)  # Description of risk impact
    risk_score_impact: Mapped[float] = mapped_column(Float, nullable=True)  # Score modifier

    # â”€â”€â”€ Metadata â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    reviewed: Mapped[bool] = mapped_column(default=False)
    reviewed_by: Mapped[str] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
