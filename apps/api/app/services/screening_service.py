"""
ComplyArc â€” Screening Service
Core entity resolution engine with multi-algorithm fuzzy matching
"""
import json
from typing import List, Optional, Tuple
from datetime import datetime, timezone
from rapidfuzz import fuzz, process
import jellyfish
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.models.sanctions_entry import SanctionsEntry
from app.models.screening import ScreeningResult
from app.models.client import Client
from app.schemas.screening import (
    ScreenRequest, ScreenResponse, MatchDetail, BatchScreenRequest, BatchScreenResponse,
)


class ScreeningService:
    """
    Entity resolution engine â€” the heart of ComplyArc.
    
    Matching Algorithm:
    â”œâ”€â”€ Name Similarity (60% weight)
    â”‚   â”œâ”€â”€ Jaro-Winkler (best for names)
    â”‚   â”œâ”€â”€ Token Sort Ratio (handles name reordering)
    â”‚   â”œâ”€â”€ Partial Ratio (handles partial matches)
    â”‚   â””â”€â”€ Phonetic (Soundex/Metaphone)
    â”œâ”€â”€ DOB Match (15% weight)
    â”œâ”€â”€ Nationality Match (10% weight)
    â”œâ”€â”€ ID Number Match (10% weight)
    â””â”€â”€ Address Similarity (5% weight)
    """

    # â”€â”€â”€ Weights â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    WEIGHT_NAME = 0.60
    WEIGHT_DOB = 0.15
    WEIGHT_NATIONALITY = 0.10
    WEIGHT_ID = 0.10
    WEIGHT_ADDRESS = 0.05

    # â”€â”€â”€ Name Sub-Weights â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    NAME_JARO_WINKLER = 0.35
    NAME_TOKEN_SORT = 0.30
    NAME_PARTIAL = 0.20
    NAME_PHONETIC = 0.15

    @staticmethod
    def _normalize_name(name: str) -> str:
        """Normalize name for comparison."""
        if not name:
            return ""
        return " ".join(name.lower().strip().split())

    @staticmethod
    def _name_similarity(name1: str, name2: str) -> float:
        """
        Multi-algorithm name similarity score (0-100).
        Combines Jaro-Winkler, token sort, partial ratio, and phonetic matching.
        """
        n1 = ScreeningService._normalize_name(name1)
        n2 = ScreeningService._normalize_name(name2)

        if not n1 or not n2:
            return 0.0

        # Jaro-Winkler (excellent for names, emphasizes prefix matches)
        jw_score = jellyfish.jaro_winkler_similarity(n1, n2) * 100

        # Token Sort Ratio (handles "John Smith" vs "Smith, John")
        token_sort = fuzz.token_sort_ratio(n1, n2)

        # Partial Ratio (handles partial matches like "John" in "John A. Smith")
        partial = fuzz.partial_ratio(n1, n2)

        # Phonetic matching (Soundex â€” handles misspellings)
        try:
            s1 = jellyfish.soundex(n1.split()[0]) if n1.split() else ""
            s2 = jellyfish.soundex(n2.split()[0]) if n2.split() else ""
            phonetic_score = 100.0 if s1 == s2 and s1 else 0.0

            # Also check Metaphone
            m1 = jellyfish.metaphone(n1.split()[0]) if n1.split() else ""
            m2 = jellyfish.metaphone(n2.split()[0]) if n2.split() else ""
            if m1 == m2 and m1:
                phonetic_score = max(phonetic_score, 80.0)
        except Exception:
            phonetic_score = 0.0

        # Weighted combination
        score = (
            jw_score * ScreeningService.NAME_JARO_WINKLER
            + token_sort * ScreeningService.NAME_TOKEN_SORT
            + partial * ScreeningService.NAME_PARTIAL
            + phonetic_score * ScreeningService.NAME_PHONETIC
        )

        return round(min(score, 100.0), 2)

    @staticmethod
    def _dob_match(dob1: Optional[str], dob2: Optional[str]) -> float:
        """DOB comparison score (0-100)."""
        if not dob1 or not dob2:
            return 50.0  # Neutral when missing

        try:
            if dob1 == dob2:
                return 100.0
            # Year-only match
            if dob1[:4] == dob2[:4]:
                return 60.0
            return 0.0
        except Exception:
            return 50.0

    @staticmethod
    def _nationality_match(nat1: Optional[str], nat2: Optional[str]) -> float:
        """Nationality comparison score (0-100)."""
        if not nat1 or not nat2:
            return 50.0  # Neutral when missing
        return 100.0 if nat1.upper() == nat2.upper() else 0.0

    @staticmethod
    def _id_match(id1: Optional[str], id2: Optional[str]) -> float:
        """ID number comparison score (0-100)."""
        if not id1 or not id2:
            return 50.0  # Neutral when missing
        # Normalize: remove spaces, dashes
        clean1 = id1.replace(" ", "").replace("-", "").upper()
        clean2 = id2.replace(" ", "").replace("-", "").upper()
        return 100.0 if clean1 == clean2 else 0.0

    @staticmethod
    def _calculate_match_score(
        name_sim: float,
        dob_score: float,
        nat_score: float,
        id_score: float,
        addr_score: float = 50.0,
    ) -> float:
        """Calculate weighted overall match score."""
        score = (
            name_sim * ScreeningService.WEIGHT_NAME
            + dob_score * ScreeningService.WEIGHT_DOB
            + nat_score * ScreeningService.WEIGHT_NATIONALITY
            + id_score * ScreeningService.WEIGHT_ID
            + addr_score * ScreeningService.WEIGHT_ADDRESS
        )
        return round(min(score, 100.0), 2)

    @staticmethod
    def _get_confidence(score: float) -> str:
        """Map score to confidence level."""
        if score >= 85:
            return "high"
        elif score >= 70:
            return "medium"
        elif score >= 50:
            return "low"
        return "none"

    @staticmethod
    def _build_explanation(
        name_sim: float,
        dob_match: Optional[bool],
        nat_match: Optional[bool],
        entry: SanctionsEntry,
    ) -> str:
        """Build human-readable match explanation."""
        parts = []
        parts.append(f"Name similarity: {name_sim:.1f}%")

        if dob_match is True:
            parts.append("DOB: Match âœ“")
        elif dob_match is False:
            parts.append("DOB: No match âœ—")
        else:
            parts.append("DOB: Not available")

        if nat_match is True:
            parts.append("Nationality: Match âœ“")
        elif nat_match is False:
            parts.append("Nationality: No match âœ—")
        else:
            parts.append("Nationality: Not available")

        parts.append(f"Source: {entry.list_type}")
        if entry.program:
            parts.append(f"Program: {entry.program}")

        return " | ".join(parts)

    async def screen_entity(
        self,
        db: AsyncSession,
        request: ScreenRequest,
        screened_by: Optional[str] = None,
        screening_type: str = "manual",
    ) -> ScreenResponse:
        """
        Screen an entity against all sanctions/PEP lists.
        Returns matches sorted by confidence.
        """
        # Determine which lists to screen against
        target_lists = request.lists or ["OFAC", "EU", "UN", "UK", "PEP"]

        # Fetch sanctions entries for target lists
        query = select(SanctionsEntry).where(
            SanctionsEntry.list_type.in_(target_lists),
            SanctionsEntry.is_active == True,
        )
        result = await db.execute(query)
        entries = result.scalars().all()

        matches: List[MatchDetail] = []

        for entry in entries:
            # Calculate name similarity against main name
            name_sim = self._name_similarity(request.name, entry.full_name)

            # Quick pre-filter: skip if name similarity is too low
            if name_sim < 40:
                # Also check aliases
                if entry.aliases:
                    try:
                        aliases = json.loads(entry.aliases) if isinstance(entry.aliases, str) else []
                        best_alias_sim = max(
                            (self._name_similarity(request.name, alias) for alias in aliases),
                            default=0,
                        )
                        if best_alias_sim > name_sim:
                            name_sim = best_alias_sim
                    except (json.JSONDecodeError, TypeError):
                        pass

                if name_sim < 40:
                    continue

            # Calculate sub-scores
            dob_score = self._dob_match(request.date_of_birth, entry.date_of_birth)
            nat_score = self._nationality_match(request.nationality, entry.nationality)
            id_score = self._id_match(request.id_number, None)  # Sanctions entries rarely have IDs

            # Overall match score
            match_score = self._calculate_match_score(name_sim, dob_score, nat_score, id_score)

            # Skip low-confidence matches
            if match_score < 45:
                continue

            confidence = self._get_confidence(match_score)
            dob_matched = dob_score == 100.0 if request.date_of_birth and entry.date_of_birth else None
            nat_matched = nat_score == 100.0 if request.nationality and entry.nationality else None

            explanation = self._build_explanation(name_sim, dob_matched, nat_matched, entry)

            match_detail = MatchDetail(
                matched_name=entry.full_name,
                matched_list=entry.list_type,
                match_score=match_score,
                match_confidence=confidence,
                name_similarity=name_sim,
                dob_match=dob_matched,
                nationality_match=nat_matched,
                source_id=entry.source_id,
                program=entry.program,
                listed_date=entry.listed_date,
                explanation=explanation,
            )
            matches.append(match_detail)

        # Sort by match score descending
        matches.sort(key=lambda m: m.match_score, reverse=True)

        # Limit to top 20 matches
        matches = matches[:20]

        # Determine overall risk
        highest_score = matches[0].match_score if matches else 0
        if highest_score >= 85:
            overall_risk = "high"
        elif highest_score >= 70:
            overall_risk = "medium"
        elif highest_score >= 50:
            overall_risk = "low"
        else:
            overall_risk = "clear"

        # Save results to database
        screening_results = []
        for match in matches:
            sr = ScreeningResult(
                client_id=None,
                screened_entity=request.name,
                screened_type=request.entity_type,
                matched_name=match.matched_name,
                matched_list=match.matched_list,
                matched_entry_id=match.source_id,
                match_score=match.match_score,
                match_confidence=match.match_confidence,
                name_similarity=match.name_similarity,
                dob_match=match.dob_match,
                nationality_match=match.nationality_match,
                explanation=match.explanation,
                screened_by=screened_by or "system",
                screening_type=screening_type,
            )
            db.add(sr)
            screening_results.append(sr)

        if screening_results:
            await db.flush()

        screening_id = screening_results[0].id if screening_results else "no-matches"

        return ScreenResponse(
            screening_id=screening_id,
            screened_entity=request.name,
            total_matches=len(matches),
            highest_score=highest_score,
            overall_risk=overall_risk,
            matches=matches,
            ai_summary=None,
            screened_at=datetime.now(timezone.utc),
        )

    async def batch_screen(
        self,
        db: AsyncSession,
        request: BatchScreenRequest,
        screened_by: Optional[str] = None,
    ) -> BatchScreenResponse:
        """Screen multiple entities in batch."""
        results = []
        total_matches = 0
        high_risk_count = 0

        for entity in request.entities:
            result = await self.screen_entity(db, entity, screened_by, "batch")
            results.append(result)
            total_matches += result.total_matches
            if result.overall_risk == "high":
                high_risk_count += 1

        return BatchScreenResponse(
            results=results,
            total_entities=len(results),
            total_matches=total_matches,
            high_risk_count=high_risk_count,
        )


# Singleton
screening_service = ScreeningService()
