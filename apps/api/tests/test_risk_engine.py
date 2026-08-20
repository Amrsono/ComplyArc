"""
Unit and integration tests for Risk Engine Service
Multi-factor risk scoring: CRR (0.40) + GRR (0.20) + PRR (0.20) + IRR (0.20)
"""
import pytest
from app.services.risk_engine import risk_engine, FATF_BLACKLIST, FATF_GREYLIST, HIGH_RISK_PRODUCTS
from app.models.client import Client
from app.models.ubo import UBO
from app.models.screening import ScreeningResult
from app.models.adverse_media import AdverseMedia
from app.schemas.risk import RiskCalculateRequest


@pytest.mark.asyncio
async def test_geography_risk_calculations():
    """Test FATF Blacklist, Greylist, Corruption index, and standard jurisdictions."""
    # FATF Blacklist (e.g. KP, IR, MM) -> 5.0
    client_kp = Client(name="Test Corp KP", country="KP")
    score_kp, factors_kp = risk_engine.calculate_geography_risk(client_kp)
    assert score_kp == 5.0
    assert any("FATF blacklist" in f for f in factors_kp)

    # FATF Greylist (e.g. NG, ZA, PH) -> 4.0
    client_ng = Client(name="Test Corp NG", country="NG")
    score_ng, factors_ng = risk_engine.calculate_geography_risk(client_ng)
    assert score_ng == 4.0
    assert any("grey list" in f for f in factors_ng)

    # High Corruption (e.g. VE, SO) -> 3.5
    client_ve = Client(name="Test Corp VE", country="VE")
    score_ve, factors_ve = risk_engine.calculate_geography_risk(client_ve)
    assert score_ve == 3.5
    assert any("corruption" in f for f in factors_ve)

    # Standard Country (e.g. US, DE, JP) -> 1.0
    client_us = Client(name="Test Corp US", country="US")
    score_us, factors_us = risk_engine.calculate_geography_risk(client_us)
    assert score_us == 1.0

    # Missing Country -> Default 1.0
    client_none = Client(name="Test Corp Unknown", country=None)
    score_none, factors_none = risk_engine.calculate_geography_risk(client_none)
    assert score_none == 1.0


@pytest.mark.asyncio
async def test_product_risk_calculations():
    """Test product risk categorizations: High (5.0), Medium (3.0), Low (1.0)."""
    # High-Risk Products
    client_crypto = Client(name="Crypto LLC", product_type="crypto_exchange")
    score_crypto, factors_crypto = risk_engine.calculate_product_risk(client_crypto)
    assert score_crypto == 5.0
    assert any("High-risk" in f for f in factors_crypto)

    client_cash = Client(name="Money Ex", product_type="cash_services")
    score_cash, _ = risk_engine.calculate_product_risk(client_cash)
    assert score_cash == 5.0

    # Medium-Risk Products
    client_re = Client(name="Real Estate Ltd", product_type="real_estate")
    score_re, factors_re = risk_engine.calculate_product_risk(client_re)
    assert score_re == 3.0
    assert any("Medium-risk" in f for f in factors_re)

    # Low-Risk Products
    client_adv = Client(name="Advisory Partners", product_type="advisory")
    score_adv, factors_adv = risk_engine.calculate_product_risk(client_adv)
    assert score_adv == 1.0
    assert any("Low-risk" in f for f in factors_adv)


@pytest.mark.asyncio
async def test_interface_risk_calculations():
    """Test interface and onboarding channel risk factors."""
    # Direct + Face-to-Face -> Low (1.0)
    client_direct = Client(
        name="Direct Client",
        interface_type="direct",
        onboarding_channel="face_to_face",
    )
    score_dir, factors_dir = risk_engine.calculate_interface_risk(client_direct)
    assert score_dir == 1.0

    # Intermediary (+1.5) + Remote (+1.0) -> Elevated (3.5)
    client_inter = Client(
        name="Intermediary Remote Client",
        interface_type="intermediary",
        onboarding_channel="remote",
    )
    score_inter, factors_inter = risk_engine.calculate_interface_risk(client_inter)
    assert score_inter == 3.5
    assert any("intermediary" in f for f in factors_inter)
    assert any("Remote/online" in f for f in factors_inter)


@pytest.mark.asyncio
async def test_client_risk_and_ubos(db_session):
    """Test client risk rating including PEP flag, sanctions hits, and UBO risk."""
    client = Client(
        name="Global Offshore Holdings",
        type="corporate",
        country="PA",
        pep_status=True,
    )
    db_session.add(client)
    await db_session.commit()
    await db_session.refresh(client)

    # Add UBOs with risk flags
    ubo1 = UBO(client_id=client.id, name="UBO Alpha", ownership_percent=40.0, risk_flag=True)
    ubo2 = UBO(client_id=client.id, name="UBO Beta", ownership_percent=30.0, risk_flag=False)
    db_session.add_all([ubo1, ubo2])
    await db_session.commit()

    score, factors = await risk_engine.calculate_client_risk(db_session, client)
    # Base 1.0 + PEP 1.5 + UBO Risk 1.0 = 3.5
    assert score >= 3.5
    assert any("PEP status" in f for f in factors)
    assert any("UBO" in f for f in factors)


@pytest.mark.asyncio
async def test_full_risk_calculation_and_overrides(db_session):
    """Test end-to-end composite risk calculation and manual overrides."""
    client = Client(
        name="Apex Trading International",
        type="corporate",
        country="KP",  # GRR = 5.0
        product_type="crypto_exchange",  # PRR = 5.0
        interface_type="intermediary",
        onboarding_channel="remote",  # IRR = 3.5
        pep_status=True,  # CRR >= 2.5
    )
    db_session.add(client)
    await db_session.commit()
    await db_session.refresh(client)

    req = RiskCalculateRequest(client_id=client.id)
    response = await risk_engine.calculate_risk(db_session, req, calculated_by="tester")

    assert response.client_id == client.id
    assert response.total_score >= 3.5
    assert response.risk_level in ["medium", "high"]
    assert response.version == 1
    assert response.breakdown.geography_risk.score == 5.0

    # Second calculation with manual overrides
    override_req = RiskCalculateRequest(
        client_id=client.id,
        geography_risk_override=1.5,
        product_risk_override=1.0,
    )
    response2 = await risk_engine.calculate_risk(db_session, override_req, calculated_by="officer")
    assert response2.version == 2
    assert response2.breakdown.geography_risk.score == 1.5
    assert response2.breakdown.product_risk.score == 1.0
    assert "Manual override applied" in response2.breakdown.geography_risk.factors
