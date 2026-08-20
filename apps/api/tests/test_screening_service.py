"""
Unit and integration tests for Screening Service and Entity Resolution
"""
import pytest
from app.services.screening_service import screening_service
from app.schemas.screening import ScreenRequest, BatchScreenRequest
from app.models.sanctions_entry import SanctionsEntry


def test_arabic_name_normalization():
    """Test Arabic transliteration normalization rules."""
    norm1 = screening_service._normalize_arabic_name("Mohamed Ahmed")
    norm2 = screening_service._normalize_arabic_name("Mohammed Ahmad")
    norm3 = screening_service._normalize_arabic_name("Mohd Ahmad")
    norm4 = screening_service._normalize_arabic_name("Al-Mohamed El-Ahmed")

    assert norm1 == norm2
    assert norm1 == norm3
    assert norm1 == norm4


def test_name_similarity_algorithms():
    """Test fuzzy name matching across token sort, partial, and phonetic variations."""
    # Exact match -> 100
    assert screening_service._name_similarity("Vladimir Putin", "Vladimir Putin") == 100.0

    # Token reordering: "Putin, Vladimir" vs "Vladimir Putin"
    reordered_sim = screening_service._name_similarity("Putin Vladimir", "Vladimir Putin")
    assert reordered_sim > 60.0

    # Transliteration similarity
    translit_sim = screening_service._name_similarity("Mohamed Al-Mansoor", "Mohammed Mansour")
    assert translit_sim > 80.0

    # Phonetic misspelling: "Smith" vs "Smyth"
    phonetic_sim = screening_service._name_similarity("John Smyth", "John Smith")
    assert phonetic_sim > 80.0

    # Dissimilar names -> Low
    assert screening_service._name_similarity("Alice Cooper", "Bob Dylan") < 35.0


def test_name_similarity_phonetic_exception_regression():
    """Ensure name similarity handles empty tokens/special chars without raising NameError or UnboundLocalError."""
    sim = screening_service._name_similarity("   ", "Normal Name")
    assert sim == 0.0

    sim2 = screening_service._name_similarity("!!!@@@###", "Test Name")
    assert isinstance(sim2, float)
    assert 0.0 <= sim2 <= 100.0


def test_dob_matching():
    """Test Date of Birth matching logic."""
    # Exact match
    assert screening_service._dob_match("1980-05-15", "1980-05-15") == 100.0
    # Year-only match
    assert screening_service._dob_match("1980-05-15", "1980-12-01") == 60.0
    # Complete mismatch
    assert screening_service._dob_match("1980-05-15", "1995-01-01") == 0.0
    # Missing DOB -> neutral 50.0
    assert screening_service._dob_match(None, "1980-05-15") == 50.0


def test_nationality_and_id_matching():
    """Test nationality and ID normalization/matching."""
    # Nationality
    assert screening_service._nationality_match("US", "us") == 100.0
    assert screening_service._nationality_match("US", "GB") == 0.0
    assert screening_service._nationality_match(None, "US") == 50.0

    # ID number stripping formatting
    assert screening_service._id_match("A-123 456", "A123456") == 100.0
    assert screening_service._id_match("P987654", "P123456") == 0.0


def test_confidence_threshold_mapping():
    """Test risk confidence levels."""
    assert screening_service._get_confidence(90.0) == "high"
    assert screening_service._get_confidence(85.0) == "high"
    assert screening_service._get_confidence(75.0) == "medium"
    assert screening_service._get_confidence(55.0) == "low"
    assert screening_service._get_confidence(40.0) == "none"


@pytest.mark.asyncio
async def test_screen_entity_with_database(db_session, seed_sanctions):
    """Test full entity screening against seeded sanctions database."""
    # Screen exact match with aliases
    req = ScreenRequest(
        name="Vladimir Putin",
        entity_type="individual",
        date_of_birth="1952-10-07",
        nationality="RU",
    )
    result = await screening_service.screen_entity(db_session, req, screened_by="tester")

    assert result.total_matches >= 1
    assert result.overall_risk in ["high", "medium"]
    top_match = result.matches[0]
    assert "Putin" in top_match.matched_name
    assert top_match.matched_list == "OFAC"
    assert top_match.dob_match is True
    assert top_match.nationality_match is True


@pytest.mark.asyncio
async def test_batch_screen_entities(db_session, seed_sanctions):
    """Test batch screening multiple entities."""
    batch_req = BatchScreenRequest(
        entities=[
            ScreenRequest(name="Vladimir Putin", date_of_birth="1952-10-07", nationality="RU"),
            ScreenRequest(name="Clean Citizen Person", date_of_birth="1990-01-01", nationality="US"),
        ]
    )
    response = await screening_service.batch_screen(db_session, batch_req, screened_by="batch_worker")
    assert response.total_entities == 2
    assert response.total_matches >= 1
    assert len(response.results) == 2
