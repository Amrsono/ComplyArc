"""
ComplyArc â€” Adverse Media AI Service
LLM-powered news analysis with entity extraction and risk classification
"""
import json
import logging
from typing import List, Optional
from datetime import datetime, timezone
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.adverse_media import AdverseMedia
from app.core.config import settings
from app.schemas.media import MediaSearchRequest, MediaSearchResponse, MediaHitResponse

logger = logging.getLogger(__name__)


class AdverseMediaService:
    """
    AI-powered adverse media engine â€” ComplyArc's competitive advantage.
    
    Pipeline:
    1. Search news APIs for entity mentions
    2. LLM classifies each article (fraud/corruption/terrorism/etc.)
    3. Calculate relevance and severity scores
    4. Generate risk impact assessment
    """

    CATEGORIES = [
        "fraud", "corruption", "terrorism", "money_laundering",
        "sanctions_evasion", "tax_evasion", "bribery", "embezzlement",
        "organized_crime", "human_trafficking", "drug_trafficking",
        "cybercrime", "environmental_crime", "other",
    ]

    async def search_media(
        self,
        db: AsyncSession,
        request: MediaSearchRequest,
    ) -> MediaSearchResponse:
        """Search for adverse media about an entity and classify using AI."""
        articles = await self._fetch_news(request.entity_name)

        results: List[MediaHitResponse] = []
        high_severity_count = 0

        for article in articles:
            # Classify with AI
            classification = await self._classify_article(
                request.entity_name, article
            )

            media_entry = AdverseMedia(
                client_id=request.client_id,
                entity_name=request.entity_name,
                title=article.get("title"),
                source=article.get("source"),
                source_url=article.get("url"),
                published_date=article.get("published_date"),
                snippet=article.get("description"),
                category=classification.get("category"),
                severity=classification.get("severity"),
                relevance_score=classification.get("relevance_score"),
                confidence_score=classification.get("confidence_score"),
                ai_summary=classification.get("summary"),
                risk_impact=classification.get("risk_impact"),
                risk_score_impact=classification.get("risk_score_impact"),
            )
            db.add(media_entry)
            await db.flush()

            if classification.get("severity") in ("high", "critical"):
                high_severity_count += 1

            results.append(MediaHitResponse(
                id=media_entry.id,
                entity_name=request.entity_name,
                title=article.get("title"),
                source=article.get("source"),
                source_url=article.get("url"),
                published_date=article.get("published_date"),
                snippet=article.get("description"),
                category=classification.get("category"),
                severity=classification.get("severity"),
                relevance_score=classification.get("relevance_score"),
                confidence_score=classification.get("confidence_score"),
                ai_summary=classification.get("summary"),
                risk_impact=classification.get("risk_impact"),
                created_at=media_entry.created_at,
            ))

        # Generate overall summary if we have results
        overall_summary = None
        if results and settings.OPENAI_API_KEY:
            overall_summary = await self._generate_overall_summary(
                request.entity_name, results
            )

        return MediaSearchResponse(
            entity_name=request.entity_name,
            total_hits=len(results),
            high_severity=high_severity_count,
            results=results,
            ai_overall_summary=overall_summary,
        )

    async def _fetch_news(self, entity_name: str) -> List[dict]:
        """Fetch news articles about an entity from news API."""
        if not settings.NEWS_API_KEY:
            # Return demo data when no API key is configured
            return self._get_demo_news(entity_name)

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    "https://newsapi.org/v2/everything",
                    params={
                        "q": f'"{entity_name}" AND (fraud OR corruption OR sanctions OR crime OR money laundering)',
                        "language": "en",
                        "sortBy": "relevancy",
                        "pageSize": 10,
                        "apiKey": settings.NEWS_API_KEY,
                    },
                )
                if response.status_code == 200:
                    data = response.json()
                    articles = []
                    for a in data.get("articles", []):
                        articles.append({
                            "title": a.get("title"),
                            "source": a.get("source", {}).get("name"),
                            "url": a.get("url"),
                            "description": a.get("description"),
                            "published_date": a.get("publishedAt", "")[:10],
                        })
                    return articles
        except Exception as e:
            logger.error(f"News API error: {e}")

        return self._get_demo_news(entity_name)

    def _get_demo_news(self, entity_name: str) -> List[dict]:
        """Return demo news data for development/testing."""
        return [
            {
                "title": f"Investigation reveals potential financial irregularities linked to {entity_name}",
                "source": "Financial Times",
                "url": "https://example.com/article1",
                "description": f"A recent investigation has uncovered potential financial irregularities involving {entity_name}. Authorities are examining transactions spanning multiple jurisdictions.",
                "published_date": "2024-06-15",
            },
            {
                "title": f"Regulatory scrutiny increases for entities associated with {entity_name}",
                "source": "Reuters",
                "url": "https://example.com/article2",
                "description": f"Multiple regulatory bodies have increased their scrutiny of business operations connected to {entity_name} following whistleblower complaints.",
                "published_date": "2024-05-20",
            },
        ]

    async def _classify_article(self, entity_name: str, article: dict) -> dict:
        """Use LLM to classify an article's risk category and severity."""
        if not settings.OPENAI_API_KEY:
            return self._demo_classification(article)

        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            prompt = f"""Analyze this news article for AML/compliance risk regarding the entity "{entity_name}".

Title: {article.get('title', '')}
Source: {article.get('source', '')}
Content: {article.get('description', '')}

Respond in JSON format with these exact fields:
{{
    "category": "one of: fraud, corruption, terrorism, money_laundering, sanctions_evasion, tax_evasion, bribery, embezzlement, organized_crime, other",
    "severity": "one of: low, medium, high, critical",
    "relevance_score": 0-100 (how relevant to the entity),
    "confidence_score": 0-100 (confidence in classification),
    "summary": "2-3 sentence risk summary",
    "risk_impact": "brief description of potential compliance risk impact",
    "risk_score_impact": 0.0-2.0 (suggested risk score increase)
}}"""

            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert AML compliance analyst. Classify news articles for financial crime risk. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=500,
            )

            result_text = response.choices[0].message.content.strip()
            # Clean potential markdown wrapping
            if result_text.startswith("```"):
                result_text = result_text.split("\n", 1)[1].rsplit("```", 1)[0]
            return json.loads(result_text)

        except Exception as e:
            logger.error(f"OpenAI classification error: {e}")
            return self._demo_classification(article)

    def _demo_classification(self, article: dict) -> dict:
        """Fallback classification for demo/development."""
        title = (article.get("title") or "").lower()
        if any(w in title for w in ["fraud", "irregularities", "misappropriation"]):
            return {
                "category": "fraud",
                "severity": "high",
                "relevance_score": 75.0,
                "confidence_score": 65.0,
                "summary": "Article discusses potential financial fraud or irregularities. Requires further compliance review.",
                "risk_impact": "Potential fraud association may increase client risk score",
                "risk_score_impact": 1.0,
            }
        elif any(w in title for w in ["regulatory", "scrutiny", "investigation"]):
            return {
                "category": "corruption",
                "severity": "medium",
                "relevance_score": 60.0,
                "confidence_score": 55.0,
                "summary": "Entity is subject to increased regulatory scrutiny. Monitor for developments.",
                "risk_impact": "Regulatory attention suggests elevated compliance risk",
                "risk_score_impact": 0.5,
            }
        return {
            "category": "other",
            "severity": "low",
            "relevance_score": 40.0,
            "confidence_score": 45.0,
            "summary": "Article mentions entity but risk relevance is limited.",
            "risk_impact": "Minimal direct compliance impact",
            "risk_score_impact": 0.1,
        }

    async def _generate_overall_summary(
        self, entity_name: str, results: List[MediaHitResponse]
    ) -> Optional[str]:
        """Generate an overall adverse media summary using LLM."""
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            articles_text = "\n".join([
                f"- [{r.category}] {r.title} (Severity: {r.severity}, Relevance: {r.relevance_score}%)"
                for r in results
            ])

            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert AML compliance analyst. Provide concise risk summaries."},
                    {"role": "user", "content": f"Provide a 2-3 sentence overall adverse media risk summary for '{entity_name}' based on these findings:\n{articles_text}"},
                ],
                temperature=0.3,
                max_tokens=200,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI summary error: {e}")
            return None


# Singleton
adverse_media_service = AdverseMediaService()
