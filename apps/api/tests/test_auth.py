"""
Unit and integration tests for Authentication, JWT, and Security
"""
import pytest
from datetime import timedelta
from jose import jwt
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token,
    generate_api_key,
    hash_api_key,
)
from app.core.config import settings
from app.models.user import User


@pytest.mark.asyncio
async def test_password_hashing():
    """Test bcrypt hashing and verification."""
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False


@pytest.mark.asyncio
async def test_jwt_token_flow():
    """Test JWT creation, claim encoding, and verification."""
    data = {"sub": "user-uuid-1234", "email": "officer@complyarc.com", "role": "compliance_officer"}
    token = create_access_token(data=data, expires_delta=timedelta(minutes=15))
    assert isinstance(token, str)
    assert len(token) > 20

    payload = verify_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user-uuid-1234"
    assert payload["email"] == "officer@complyarc.com"
    assert payload["role"] == "compliance_officer"
    assert "exp" in payload


@pytest.mark.asyncio
async def test_jwt_expired_token():
    """Test expired JWT token verification returns None."""
    data = {"sub": "user-uuid-9999"}
    # Token expired 1 hour ago
    token = create_access_token(data=data, expires_delta=timedelta(minutes=-60))
    payload = verify_access_token(token)
    assert payload is None


@pytest.mark.asyncio
async def test_api_key_generation_and_hashing():
    """Test API key prefixing and cryptographic SHA-256 hash."""
    api_key = generate_api_key()
    assert api_key.startswith("ctx_")
    assert len(api_key) > 30

    hash1 = hash_api_key(api_key)
    hash2 = hash_api_key(api_key)
    assert hash1 == hash2
    assert len(hash1) == 64  # SHA-256 hex digest length


@pytest.mark.asyncio
async def test_auth_register_and_login_api(async_client):
    """Test user registration and subsequent login via API."""
    unique_email = "new_compliance_lead@example.com"
    register_payload = {
        "email": unique_email,
        "password": "Password789!",
        "full_name": "Compliance Lead",
        "organization": "Fintech Bank",
    }
    
    # 1. Register
    reg_resp = await async_client.post("/api/v1/auth/register", json=register_payload)
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert reg_data["email"] == unique_email
    assert reg_data["role"] == "analyst"
    assert "id" in reg_data

    # 2. Duplicate registration fails
    dup_resp = await async_client.post("/api/v1/auth/register", json=register_payload)
    assert dup_resp.status_code == 400
    assert "already registered" in dup_resp.json()["detail"]

    # 3. Login with correct credentials
    login_resp = await async_client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "Password789!"},
    )
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data
    assert login_data["user"]["email"] == unique_email

    # 4. Login with invalid password
    bad_login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401


@pytest.mark.asyncio
async def test_auth_me_endpoint(async_client, test_admin_user, admin_token):
    """Test authenticated /me endpoint."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = await async_client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == test_admin_user.email
    assert data["role"] == "admin"


@pytest.mark.asyncio
async def test_api_key_management_api(async_client, admin_token):
    """Test generating and listing API keys."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await async_client.post(
        "/api/v1/auth/api-keys",
        json={"name": "Production Integration Key"},
        headers=headers,
    )
    assert create_resp.status_code == 201
    key_data = create_resp.json()
    assert "key" in key_data
    assert key_data["key"].startswith("ctx_")
    assert key_data["name"] == "Production Integration Key"

    # List API keys
    list_resp = await async_client.get("/api/v1/auth/api-keys", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1
