"""
Cortex AML — Risk Schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class RiskCalculateRequest(BaseModel):
    client_id: str
    # Optional overrides (if not provided, auto-calculated from client data)
    client_risk_override: Optional[float] = None
    geography_risk_override: Optional[float] = None
    product_risk_override: Optional[float] = None
    interface_risk_override: Optional[float] = None


class RiskFactorDetail(BaseModel):
    score: float
    factors: List[str]


class RiskBreakdown(BaseModel):
    client_risk: RiskFactorDetail
    geography_risk: RiskFactorDetail
    product_risk: RiskFactorDetail
    interface_risk: RiskFactorDetail


class RiskResponse(BaseModel):
    id: str
    client_id: str
    total_score: float
    risk_level: str
    breakdown: RiskBreakdown
    ai_summary: Optional[str] = None
    version: int
    calculated_at: datetime

    class Config:
        from_attributes = True
