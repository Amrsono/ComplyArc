"""
Cortex AML — Auth API Routes
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.core.security import hash_password, verify_password, create_access_token, generate_api_key, hash_api_key
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.client import ApiKey
from app.schemas.auth import (
    LoginRequest, TokenResponse, RegisterRequest, UserResponse,
    ApiKeyCreateRequest, ApiKeyResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    existing = await db.execute(select(User).where(User.email == request.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=request.email,
        hashed_password=hash_password(request.password),
        full_name=request.full_name,
        organization=request.organization,
        role="analyst",
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    await db.flush()
    return user


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and get JWT token."""
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    user.last_login = datetime.now(timezone.utc)
    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})

    return TokenResponse(
        access_token=token,
        expires_in=settings.JWT_EXPIRATION_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return user


@router.post("/api-keys", response_model=ApiKeyResponse, status_code=201)
async def create_api_key(
    request: ApiKeyCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new API key."""
    raw_key = generate_api_key()
    api_key = ApiKey(
        user_id=user.id,
        name=request.name,
        key_hash=hash_api_key(raw_key),
        key_prefix=raw_key[:12],
    )
    db.add(api_key)
    await db.flush()

    response = ApiKeyResponse.model_validate(api_key)
    response.key = raw_key  # Only time the full key is returned
    return response


@router.get("/api-keys", response_model=list[ApiKeyResponse])
async def list_api_keys(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's API keys."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == user.id).order_by(ApiKey.created_at.desc())
    )
    return result.scalars().all()
