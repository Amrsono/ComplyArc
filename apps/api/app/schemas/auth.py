"""
Cortex AML — Auth Schemas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserResponse"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    organization: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ApiKeyCreateRequest(BaseModel):
    name: str


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    is_active: bool
    last_used: Optional[datetime] = None
    created_at: datetime
    key: Optional[str] = None  # Only returned on creation

    class Config:
        from_attributes = True
