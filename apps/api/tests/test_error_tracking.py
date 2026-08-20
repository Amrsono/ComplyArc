"""
ComplyArc — Unit Tests for Error Tracking & Sentry Fallback
"""
import pytest
from app.core.sentry import BackendSentryClient


def test_backend_sentry_no_dsn_fallback():
    client = BackendSentryClient(dsn="")
    assert client.is_enabled is False

    event_id = client.capture_exception(ValueError("Simulated runtime error"))
    assert event_id is None


def test_backend_sentry_with_mock_dsn():
    client = BackendSentryClient(dsn="https://mock-backend-key@o0.ingest.sentry.io/0000000")
    # Even if network is not connected, the client should configure gracefully
    assert client.dsn.startswith("https://")
