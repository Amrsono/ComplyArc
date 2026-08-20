"""
ComplyArc — Unit Tests for Core Security & Auth Utilities
"""
import pytest
from datetime import timedelta
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token,
    generate_api_key,
    hash_api_key,
)


def test_password_hashing_and_verification():
    raw_pass = "SuperSecretSecurePass123!"
    hashed = hash_password(raw_pass)

    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword999", hashed) is False
    assert verify_password("", hashed) is False
    assert verify_password(raw_pass, "") is False


def test_jwt_token_generation_and_payload_decode():
    data = {"sub": "usr_test_12345", "role": "compliance_officer"}
    token = create_access_token(data, expires_delta=timedelta(minutes=30))

    assert isinstance(token, str)
    assert len(token) > 20

    payload = verify_access_token(token)
    assert payload is not None
    assert payload["sub"] == "usr_test_12345"
    assert payload["role"] == "compliance_officer"
    assert "exp" in payload


def test_invalid_and_expired_jwt_token_handling():
    invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"
    assert verify_access_token(invalid_token) is None

    # Token with negative expiration (already expired)
    expired_token = create_access_token({"sub": "expired_user"}, expires_delta=timedelta(minutes=-10))
    assert verify_access_token(expired_token) is None


def test_api_key_generation_and_hashing():
    api_key = generate_api_key()
    assert api_key.startswith("ctx_")
    assert len(api_key) > 30

    key_hash = hash_api_key(api_key)
    assert isinstance(key_hash, str)
    assert len(key_hash) == 64  # SHA-256 hex length
    assert key_hash == hash_api_key(api_key)
