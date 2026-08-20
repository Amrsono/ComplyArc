"""
Unit and integration tests for Adverse Media AI Service
"""
import pytest
from unittest.mock import AsyncMock, patch
from app.services.adverse_media_service import adverse_media_service
from app.schemas.media import MediaSearchRequest
from app.models.client import Client


def test_arabic_detection():
    """Test Arabic text detection helper."""
    assert adverse_media_service._is_arabic("محمد أحمد") is True
    assert adverse_media_service._is_arabic("John Doe") is False
    assert adverse_media_service._is_arabic("Company Ltd (شركة النيل)") is True
    assert adverse_media_service._is_arabic("") is False


def test_heuristic_classification():
    """Test fallback heuristic risk classification when LLM is unavailable."""
    fraud_article = {
        "title": "Bank Executive Indicted on Multi-Million Dollar Fraud and Misappropriation Charges",
        "description": "Federal authorities announced charges against the former executive for fraudulent accounting schemes.",
    }
    fraud_class = adverse_media_service._heuristic_classification(fraud_article)
    assert fraud_class["category"] == "fraud"
    assert fraud_class["severity"] == "high"
    assert fraud_class["relevance_score"] >= 70.0

    investigation_article = {
        "title": "Regulators Open In-Depth Scrutiny and Investigation into Energy Trading Unit",
        "description": "Authorities are investigating compliance records.",
    }
    inv_class = adverse_media_service._heuristic_classification(investigation_article)
    assert inv_class["category"] == "corruption"
    assert inv_class["severity"] == "medium"

    neutral_article = {
        "title": "Tech Company Announces New Data Center Construction",
        "description": "Expansion of cloud infrastructure completed.",
    }
    neu_class = adverse_media_service._heuristic_classification(neutral_article)
    assert neu_class["category"] == "other"
    assert neu_class["severity"] == "low"


@pytest.mark.asyncio
async def test_search_media_with_mocked_fetch(db_session):
    """Test adverse media search pipeline with mock article fetching."""
    client = Client(name="Target Test Corp", country="US")
    db_session.add(client)
    await db_session.commit()
    await db_session.refresh(client)

    mock_articles = [
        {
            "title": "Target Test Corp facing major fraud allegations in federal court",
            "source": "Financial Times",
            "url": "https://ft.com/example-news",
            "description": "Allegations of fraudulent accounting and misappropriation.",
            "published_date": "2026-05-01",
        }
    ]

    with patch.object(adverse_media_service, "_fetch_news", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_articles

        req = MediaSearchRequest(entity_name="Target Test Corp", client_id=client.id)
        response = await adverse_media_service.search_media(db_session, req)

        assert response.entity_name == "Target Test Corp"
        assert response.total_hits == 1
        assert response.high_severity == 1
        assert response.results[0].category == "fraud"
        assert response.results[0].severity == "high"
