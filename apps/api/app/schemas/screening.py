"""
ComplyArc â€” Screening Schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ScreenRequest(BaseModel):
    name: str
    entity_type: str = "individual"  # individual / corporate
    date_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    id_number: Optional[str] = None
    country: Optional[str] = None
    lists: Optional[List[str]] = None  # ["OFAC", "EU", "UN", "UK", "PEP"] â€” None = all

    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Smith",
                "entity_type": "individual",
                "date_of_birth": "1970-05-15",
                "nationality": "US",
            }
        }


class BatchScreenRequest(BaseModel):
    entities: List[ScreenRequest]


class MatchDetail(BaseModel):
    matched_name: str
    matched_list: str
    match_score: float
    match_confidence: str
    name_similarity: Optional[float] = None
    dob_match: Optional[bool] = None
    nationality_match: Optional[bool] = None
    source_id: Optional[str] = None
    program: Optional[str] = None
    listed_date: Optional[str] = None
    explanation: str


class ScreenResponse(BaseModel):
    screening_id: str
    screened_entity: str
    total_matches: int
    highest_score: float
    overall_risk: str  # high, medium, low, clear
    matches: List[MatchDetail]
    ai_summary: Optional[str] = None
    screened_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "screening_id": "abc-123",
                "screened_entity": "John Smith",
                "total_matches": 2,
                "highest_score": 87.5,
                "overall_risk": "high",
                "matches": [],
                "screened_at": "2024-01-01T00:00:00Z",
            }
        }


class BatchScreenResponse(BaseModel):
    results: List[ScreenResponse]
    total_entities: int
    total_matches: int
    high_risk_count: int


class ScreeningHistoryResponse(BaseModel):
    id: str
    screened_entity: str
    matched_name: str
    matched_list: str
    match_score: float
    match_confidence: str
    decision: str
    screening_type: str
    created_at: datetime

    class Config:
        from_attributes = True
