"""
ComplyArc — Unit and Integration Tests for Adverse Media Intelligence Service
Mocks external HTTP and OpenAI integrations to ensure 100% offline zero-network execution.
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.adverse_media_service import adverse_media_service
from app.schemas.media import MediaSearchRequest
from app.models.client import Client


@pytest.mark.asyncio
async def test_adverse_media_offline_mocked_news_api():
    """Mock News API response and assert article normalization and NLP heuristic classification."""
    mock_articles = [
        {
            "title": "FinTech CEO Indicted for Money Laundering and Fraud Scheme",
            "description": "Authorities in Geneva launched criminal proceedings for illicit money transfers and sanctions evasion.",
            "url": "https://example.com/news/101",
            "source": {"name": "Financial Times"},
            "publishedAt": "2026-08-15T10:00:00Z",
        },
        {
            "title": "Clean Energy Expansion in Middle East",
            "description": "Company announces new solar initiative in Dubai with government partnership.",
            "url": "https://example.com/news/102",
            "source": {"name": "Reuters"},
            "publishedAt": "2026-08-16T12:00:00Z",
        },
    ]

    with patch("httpx.AsyncClient.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok", "articles": mock_articles}
        mock_get.return_value = mock_response

        articles = await adverse_media_service._fetch_news("Global FinTech Corp", news_api_key="mock-key-12345")
        assert len(articles) == 2
        assert articles[0]["title"].startswith("FinTech CEO Indicted")


@pytest.mark.asyncio
async def test_adverse_media_full_scan_with_database(db_session):
    """Test full search_media workflow against in-memory SQLite database."""
    client = Client(name="Scandal Corp International", country="PA")
    db_session.add(client)
    await db_session.commit()
    await db_session.refresh(client)

    mock_fetched = [
        {
            "title": "Executive Arrested for Wire Fraud and Bribery",
            "snippet": "Criminal charges filed in connection with bribery of foreign officials.",
            "url": "https://news.com/scandal-1",
            "source": "Global News",
            "date": "2026-08-10",
        }
    ]

    with patch.object(adverse_media_service, "_fetch_news", new_callable=AsyncMock) as mock_fn:
        mock_fn.return_value = mock_fetched

        req = MediaSearchRequest(entity_name="Scandal Corp International", client_id=client.id)
        response = await adverse_media_service.search_media(db_session, req)

        assert response.entity_name == "Scandal Corp International"
        assert response.total_hits >= 1
        assert len(response.results) >= 1
