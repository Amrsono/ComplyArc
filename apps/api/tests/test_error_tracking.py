"""
ComplyArc — Unit Tests for Error Tracking & Sentry Fallback
"""
import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from app.core.sentry import BackendSentryClient
from api.index import app


def test_backend_sentry_no_dsn_fallback():
    client = BackendSentryClient(dsn="")
    assert client.is_enabled is False

    event_id = client.capture_exception(ValueError("Simulated runtime error"))
    assert event_id is None


def test_backend_sentry_with_mock_dsn():
    client = BackendSentryClient(dsn="https://mock-backend-key@o0.ingest.sentry.io/0000000")
    assert client.dsn.startswith("https://")


@pytest.mark.asyncio
async def test_app_boots_without_sentry_dsn():
    """Ensure the FastAPI app boots and serves health endpoint cleanly without SENTRY_DSN."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/health")
        assert response.status_code == 200
        assert "status" in response.json()


@pytest.mark.asyncio
async def test_app_boots_with_sentry_dsn_configured():
    """Ensure the FastAPI app boots cleanly when SENTRY_DSN is configured."""
    with patch.dict("os.environ", {"SENTRY_DSN": "https://dummy-dsn@sentry.io/12345"}):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.get("/api/health")
            assert response.status_code == 200
