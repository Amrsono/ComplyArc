"""
ComplyArc — Unit Tests for FastAPI Security Dependencies & RBAC
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.core.deps import get_current_user, get_current_user_optional, require_role
from app.core.security import create_access_token
from app.models.user import User


@pytest.mark.asyncio
async def test_get_current_user_valid_token():
    user = User(
        id="usr_admin_1",
        email="compliance@arc.com",
        full_name="Compliance Manager",
        role="compliance_officer",
        is_active=True,
    )
    token = create_access_token({"sub": "usr_admin_1"})

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = user
    mock_db.execute.return_value = mock_result

    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    resolved_user = await get_current_user(credentials=creds, db=mock_db)

    assert resolved_user.id == "usr_admin_1"
    assert resolved_user.email == "compliance@arc.com"


@pytest.mark.asyncio
async def test_get_current_user_missing_or_invalid_credentials():
    mock_db = AsyncMock()

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials=None, db=mock_db)
    assert exc_info.value.status_code == 401
    assert "Not authenticated" in exc_info.value.detail

    bad_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid-token")
    with pytest.raises(HTTPException) as exc_info2:
        await get_current_user(credentials=bad_creds, db=mock_db)
    assert exc_info2.value.status_code == 401
    assert "Invalid or expired token" in exc_info2.value.detail


@pytest.mark.asyncio
async def test_get_current_user_optional():
    mock_db = AsyncMock()
    assert await get_current_user_optional(credentials=None, db=mock_db) is None


@pytest.mark.asyncio
async def test_require_role_rbac_enforcement():
    admin_user = User(id="u1", email="admin@complyarc.com", role="admin", is_active=True)
    analyst_user = User(id="u2", email="analyst@complyarc.com", role="analyst", is_active=True)

    admin_checker = require_role("admin")
    assert await admin_checker(admin_user) == admin_user

    # Admin role can access analyst routes
    analyst_checker = require_role("analyst")
    assert await analyst_checker(admin_user) == admin_user
    assert await analyst_checker(analyst_user) == analyst_user

    # Analyst cannot access admin-only routes
    with pytest.raises(HTTPException) as exc_info:
        await admin_checker(analyst_user)
    assert exc_info.value.status_code == 403
