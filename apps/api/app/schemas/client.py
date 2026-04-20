"""
ComplyArc â€” Client Schemas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class ClientCreateRequest(BaseModel):
    name: str
    type: str = "individual"  # individual / corporate
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    id_number: Optional[str] = None
    id_type: Optional[str] = None
    registration_number: Optional[str] = None
    incorporation_country: Optional[str] = None
    incorporation_date: Optional[str] = None
    industry: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    product_type: Optional[str] = None
    interface_type: Optional[str] = None
    onboarding_channel: Optional[str] = None
    notes: Optional[str] = None


class ClientUpdateRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    product_type: Optional[str] = None
    interface_type: Optional[str] = None
    onboarding_channel: Optional[str] = None
    notes: Optional[str] = None
    assigned_officer: Optional[str] = None


class ClientResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    pep_status: bool = False
    sanctions_hit: bool = False
    onboarding_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ClientListResponse(BaseModel):
    items: List[ClientResponse]
    total: int
    page: int
    page_size: int


class UBORequest(BaseModel):
    name: str
    ownership_percent: float
    nationality: Optional[str] = None
    date_of_birth: Optional[str] = None
    id_number: Optional[str] = None


class UBOResponse(BaseModel):
    id: str
    client_id: str
    name: str
    ownership_percent: float
    nationality: Optional[str] = None
    pep_status: bool = False
    sanctions_hit: bool = False
    risk_flag: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
