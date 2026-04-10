"""
ComplyArc â€” Dashboard Schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DashboardStats(BaseModel):
    total_clients: int
    active_clients: int
    high_risk_clients: int
    medium_risk_clients: int
    low_risk_clients: int
    pending_clients: int
    active_cases: int
    pending_review_cases: int
    escalated_cases: int
    total_screenings: int
    screenings_today: int
    adverse_media_hits: int
    monitoring_active: int


class RiskDistribution(BaseModel):
    high: int
    medium: int
    low: int
    unscored: int


class RecentAlert(BaseModel):
    id: str
    type: str  # sanctions_match, adverse_media, risk_change, monitoring
    severity: str
    client_name: str
    client_id: str
    description: str
    created_at: datetime


class DashboardResponse(BaseModel):
    stats: DashboardStats
    risk_distribution: RiskDistribution
    recent_alerts: List[RecentAlert]
    recent_screenings: int
    cases_by_status: dict


class AuditLogResponse(BaseModel):
    id: str
    user_email: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    description: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    logs: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
