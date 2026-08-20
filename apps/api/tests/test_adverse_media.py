"""
Unit and integration tests for Adverse Media AI Service
"""
import os
import json
import pytest
from unittest.mock import AsyncMock, patch
from app.services.adverse_media_service import adverse_media_service
from app.schemas.media import MediaSearchRequest
from app.models.client import Client

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


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
async def test_search_media_with_static_fixture(db_session):
    """Test adverse media search pipeline with static fixture articles."""
    client = Client(name="Global Trade Corp", country="US")
    db_session.add(client)
    await db_session.commit()
    await db_session.refresh(client)

    with open(os.path.join(FIXTURES_DIR, "adverse_media_sample.json"), "r", encoding="utf-8") as f:
        fixture_data = json.load(f)

    mock_articles = [
        {
            "title": a["title"],
            "source": a["source"]["name"],
            "url": a["url"],
            "description": a["description"],
            "published_date": a["publishedAt"],
        }
        for a in fixture_data["articles"]
    ]

    with patch.object(adverse_media_service, "_fetch_news", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_articles

        req = MediaSearchRequest(entity_name="Global Trade Corp", client_id=client.id)
        response = await adverse_media_service.search_media(db_session, req)

        assert response.entity_name == "Global Trade Corp"
        assert response.total_hits == 2
        assert response.high_severity >= 1
        assert any(r.category in ["fraud", "money_laundering"] for r in response.results)
