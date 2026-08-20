"""
ComplyArc — Unit Tests for Narrow Typed Exception Handling
"""
import pytest
from unittest.mock import AsyncMock, patch
from app.services.screening_service import screening_service
from app.services.adverse_media_service import adverse_media_service


def test_screening_phonetic_error_graceful_handling():
    """Ensure phonetic algorithm degradation on malformed input does not crash screening."""
    # Force weird unicode input that tests exception branches
    sim = screening_service._name_similarity("\x00\x01\x02", "Normal Company")
    assert isinstance(sim, float)
    assert 0.0 <= sim <= 100.0


def test_dob_matching_error_recovery():
    """Ensure malformed or non-string date values fall back cleanly."""
    score = screening_service._dob_match("invalid-date", "2020-01-01")
    assert score == 0.0

    score_empty = screening_service._dob_match(None, "2020-01-01")
    assert score_empty == 50.0


@pytest.mark.asyncio
async def test_adverse_media_fetch_network_failure_fallback():
    """Ensure adverse media fetch falls back to RSS/empty when network client fails."""
    with patch("httpx.AsyncClient.get", side_effect=Exception("Connection refused")):
        articles = await adverse_media_service._fetch_news("Test Target Corp", news_api_key="sk-live-invalid")
        assert isinstance(articles, list)
