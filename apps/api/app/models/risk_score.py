"""
Cortex AML — Risk Score Model
Multi-factor risk scoring: CRR + GRR + PRR + IRR
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Float, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id"), nullable=False, index=True
    )

    # ─── Risk Factors (1-5 scale) ─────────────────
    client_risk: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    geography_risk: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    product_risk: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    interface_risk: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)

    # ─── Weighted Total ───────────────────────────
    total_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="low")

    # ─── Factor Explanations ──────────────────────
    client_risk_factors: Mapped[str] = mapped_column(Text, nullable=True)  # JSON array
    geography_risk_factors: Mapped[str] = mapped_column(Text, nullable=True)
    product_risk_factors: Mapped[str] = mapped_column(Text, nullable=True)
    interface_risk_factors: Mapped[str] = mapped_column(Text, nullable=True)

    # ─── AI Summary ───────────────────────────────
    ai_summary: Mapped[str] = mapped_column(Text, nullable=True)

    # ─── Metadata ─────────────────────────────────
    calculated_by: Mapped[str] = mapped_column(String(36), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
