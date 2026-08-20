"""
Unit and integration tests for Clients and Ultimate Beneficial Owners (UBOs)
"""
import pytest
from app.services.client_service import client_service
from app.models.client import Client, ClientStatus
from app.models.ubo import UBO
from app.schemas.client import ClientCreateRequest, ClientUpdateRequest


@pytest.mark.asyncio
async def test_client_crud_lifecycle(db_session):
    """Test client creation, querying, updating, and activation."""
    # 1. Create corporate client
    create_req = ClientCreateRequest(
        name="Fintech Global Pay LLC",
        type="corporate",
        country="US",
        industry="Payment Processing",
        product_type="money_transfer",
        email="contact@fintechglobal.com",
    )
    client = await client_service.create_client(db_session, create_req)
    await db_session.commit()

    assert client.id is not None
    assert client.name == "Fintech Global Pay LLC"
    assert client.status == ClientStatus.PENDING

    # 2. Get client
    fetched = await client_service.get_client(db_session, client.id)
    assert fetched is not None
    assert fetched.industry == "Payment Processing"

    # 3. Update client
    update_req = ClientUpdateRequest(
        industry="Regulated Payment Institution",
        notes="FinCEN MSB registration verified",
    )
    updated = await client_service.update_client(db_session, client.id, update_req)
    await db_session.commit()
    assert updated.industry == "Regulated Payment Institution"

    # 4. Activate client
    activated = await client_service.activate_client(db_session, client.id)
    await db_session.commit()
    assert activated.status == ClientStatus.ACTIVE
    assert activated.onboarding_date is not None
    assert activated.next_review_date is not None


@pytest.mark.asyncio
async def test_client_search_and_filtering(db_session):
    """Test client search by name/email and risk level filtering."""
    c1 = Client(name="Search Alpha Corp", email="alpha@search.com", status="active", risk_level="high")
    c2 = Client(name="Search Beta Ltd", email="beta@search.com", status="pending", risk_level="low")
    db_session.add_all([c1, c2])
    await db_session.commit()

    # Search by keyword
    search_res = await client_service.list_clients(db_session, search="Alpha")
    assert search_res.total >= 1
    assert any(c.name == "Search Alpha Corp" for c in search_res.items)

    # Filter by risk level
    high_risk_res = await client_service.list_clients(db_session, risk_level="high")
    assert high_risk_res.total >= 1
    assert all(c.risk_level == "high" for c in high_risk_res.items)


@pytest.mark.asyncio
async def test_ubo_management(db_session):
    """Test creating and querying Ultimate Beneficial Owners (UBOs) for corporate entities."""
    corp = Client(name="Multinational Conglomerate Inc", type="corporate", country="GB")
    db_session.add(corp)
    await db_session.commit()
    await db_session.refresh(corp)

    ubo1 = UBO(
        client_id=corp.id,
        name="Beneficiary Owner 1",
        ownership_percent=55.0,
        nationality="GB",
        risk_flag=False,
    )
    ubo2 = UBO(
        client_id=corp.id,
        name="Offshore Holding Trust",
        ownership_percent=45.0,
        nationality="VG",
        risk_flag=True,
    )
    db_session.add_all([ubo1, ubo2])
    await db_session.commit()

    from sqlalchemy import select
    ubos_query = await db_session.execute(select(UBO).where(UBO.client_id == corp.id))
    ubos = ubos_query.scalars().all()
    assert len(ubos) == 2
    assert sum(u.ownership_percent for u in ubos) == 100.0
    assert any(u.risk_flag is True for u in ubos)
