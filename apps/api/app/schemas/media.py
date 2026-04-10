"""
ComplyArc â€” Media Schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MediaSearchRequest(BaseModel):
    entity_name: str
    client_id: Optional[str] = None
    categories: Optional[List[str]] = None  # fraud, corruption, terrorism, etc.


class MediaHitResponse(BaseModel):
    id: str
    entity_name: str
    title: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    published_date: Optional[str] = None
    snippet: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    relevance_score: Optional[float] = None
    confidence_score: Optional[float] = None
    ai_summary: Optional[str] = None
    risk_impact: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MediaSearchResponse(BaseModel):
    entity_name: str
    total_hits: int
    high_severity: int
    results: List[MediaHitResponse]
    ai_overall_summary: Optional[str] = None
