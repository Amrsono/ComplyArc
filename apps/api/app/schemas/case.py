"""
ComplyArc â€” Case Schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CaseCreateRequest(BaseModel):
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    case_type: str  # sanctions_match, pep_match, adverse_media, risk_escalation, monitoring_alert
    priority: str = "medium"
    assigned_to: Optional[str] = None
    screening_result_id: Optional[str] = None
    adverse_media_id: Optional[str] = None


class CaseUpdateRequest(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    resolution: Optional[str] = None
    sar_filed: Optional[bool] = None
    sar_reference: Optional[str] = None


class CaseNoteRequest(BaseModel):
    content: str
    note_type: str = "comment"


class CaseNoteResponse(BaseModel):
    id: str
    case_id: str
    author_id: str
    content: str
    note_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class CaseResponse(BaseModel):
    id: str
    case_number: str
    client_id: str
    title: str
    description: Optional[str] = None
    case_type: str
    status: str
    priority: str
    assigned_to: Optional[str] = None
    resolution: Optional[str] = None
    sar_filed: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CaseListResponse(BaseModel):
    items: List[CaseResponse]
    total: int
    page: int
    page_size: int
