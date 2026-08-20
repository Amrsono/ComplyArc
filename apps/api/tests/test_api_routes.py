"""
Comprehensive End-to-End API Routes Integration Tests
"""
import pytest
from httpx import AsyncClient
from app.models.client import Client


@pytest.mark.asyncio
async def test_system_and_health_endpoints(async_client: AsyncClient):
    """Test root and health check endpoints."""
    # Root
    resp_root = await async_client.get("/")
    assert resp_root.status_code == 200
    assert resp_root.json()["status"] == "online"

    # API Welcome
    resp_api = await async_client.get("/api")
    assert resp_api.status_code == 200

    # Health Check
    resp_health = await async_client.get("/api/health")
    assert resp_health.status_code == 200
    health_data = resp_health.json()
    assert health_data["service"] == "ComplyArc API"

    # Debug Config
    resp_debug = await async_client.get("/api/v1/debug/config")
    assert resp_debug.status_code == 200
    assert "DATABASE_URL_SET" in resp_debug.json()


@pytest.mark.asyncio
async def test_clients_api_endpoints(async_client: AsyncClient, admin_token: str):
    """Test client creation, querying, updating, and activation via REST API."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create client
    client_payload = {
        "name": "Acme Tech Solutions Inc",
        "type": "corporate",
        "country": "US",
        "industry": "Software",
        "product_type": "securities",
        "email": "info@acmetech.com",
    }
    create_resp = await async_client.post("/api/v1/clients", json=client_payload, headers=headers)
    assert create_resp.status_code == 201
    client_data = create_resp.json()
    client_id = client_data["id"]
    assert client_data["name"] == "Acme Tech Solutions Inc"
    assert client_data["status"] == "pending"

    # 2. Get client by ID
    get_resp = await async_client.get(f"/api/v1/clients/{client_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == client_id

    # 3. List clients
    list_resp = await async_client.get("/api/v1/clients?search=Acme", headers=headers)
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] >= 1

    # 4. Update client
    update_resp = await async_client.patch(
        f"/api/v1/clients/{client_id}",
        json={"industry": "Enterprise Cloud Software"},
        headers=headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["industry"] == "Enterprise Cloud Software"

    # 5. Add UBO
    ubo_resp = await async_client.post(
        f"/api/v1/clients/{client_id}/ubos",
        json={
            "name": "Jane Doe",
            "ownership_percent": 60.0,
            "nationality": "US",
        },
        headers=headers,
    )
    assert ubo_resp.status_code == 201

    # 6. Get UBOs
    get_ubos_resp = await async_client.get(f"/api/v1/clients/{client_id}/ubos", headers=headers)
    assert get_ubos_resp.status_code == 200
    assert len(get_ubos_resp.json()) >= 1

    # 7. Activate client
    activate_resp = await async_client.post(f"/api/v1/clients/{client_id}/activate", headers=headers)
    assert activate_resp.status_code == 200
    assert activate_resp.json()["status"] == "active"


@pytest.mark.asyncio
async def test_screening_api_endpoints(
    async_client: AsyncClient, admin_token: str, test_api_key: str, seed_sanctions
):
    """Test manual screening, API-key external screening, and batch screening endpoints."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Manual screen with JWT
    screen_resp = await async_client.post(
        "/api/v1/screen",
        json={
            "name": "Vladimir Putin",
            "entity_type": "individual",
            "date_of_birth": "1952-10-07",
            "nationality": "RU",
        },
        headers=headers,
    )
    assert screen_resp.status_code == 200
    data = screen_resp.json()
    assert data["total_matches"] >= 1
    assert data["highest_score"] >= 70.0

    # 2. External API screen with X-API-Key
    api_key_headers = {"X-API-Key": test_api_key}
    ext_resp = await async_client.post(
        "/api/v1/screen/api",
        json={"name": "Cyber Threat Network LLC", "entity_type": "corporate"},
        headers=api_key_headers,
    )
    assert ext_resp.status_code == 200
    assert ext_resp.json()["total_matches"] >= 1

    # 3. Batch screen
    batch_resp = await async_client.post(
        "/api/v1/screen/batch",
        json={
            "entities": [
                {"name": "Mohamed Ahmed Al-Mansoor", "nationality": "SY"},
                {"name": "Regular Tech Corp", "nationality": "US"},
            ]
        },
        headers=headers,
    )
    assert batch_resp.status_code == 200
    assert batch_resp.json()["total_entities"] == 2


@pytest.mark.asyncio
async def test_risk_api_endpoints(async_client: AsyncClient, admin_token: str, db_session):
    """Test risk calculation and history retrieval."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Setup client
    client = Client(name="Risk Target Corp", country="KP", product_type="crypto_exchange")
    db_session.add(client)
    await db_session.commit()
    await db_session.refresh(client)

    # 1. Calculate risk
    calc_resp = await async_client.post(
        "/api/v1/risk/calculate",
        json={"client_id": client.id},
        headers=headers,
    )
    assert calc_resp.status_code == 200
    risk_data = calc_resp.json()
    assert risk_data["total_score"] >= 2.5
    assert risk_data["risk_level"] in ["medium", "high"]

    # 2. Get latest client risk
    get_risk_resp = await async_client.get(f"/api/v1/risk/client/{client.id}", headers=headers)
    assert get_risk_resp.status_code == 200
    assert get_risk_resp.json()["total_score"] == risk_data["total_score"]


@pytest.mark.asyncio
async def test_cases_api_endpoints(async_client: AsyncClient, admin_token: str, db_session):
    """Test case creation, querying, status updating, and adding notes."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    client = Client(name="Case Target Corp", country="US")
    db_session.add(client)
    await db_session.commit()
    await db_session.refresh(client)

    # 1. Create case
    create_resp = await async_client.post(
        "/api/v1/cases",
        json={
            "client_id": client.id,
            "title": "Adverse Media Inflow Alert",
            "case_type": "adverse_media",
            "priority": "high",
        },
        headers=headers,
    )
    assert create_resp.status_code == 201
    case_data = create_resp.json()
    case_id = case_data["id"]
    assert case_data["status"] == "open"

    # 2. Get case
    get_resp = await async_client.get(f"/api/v1/cases/{case_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["title"] == "Adverse Media Inflow Alert"

    # 3. Add note
    note_resp = await async_client.post(
        f"/api/v1/cases/{case_id}/notes",
        json={"content": "Case escalated to Head of Financial Crime.", "note_type": "escalation"},
        headers=headers,
    )
    assert note_resp.status_code == 201

    # 4. Get notes
    notes_resp = await async_client.get(f"/api/v1/cases/{case_id}/notes", headers=headers)
    assert notes_resp.status_code == 200
    assert len(notes_resp.json()) >= 1


@pytest.mark.asyncio
async def test_dashboard_and_settings_endpoints(async_client: AsyncClient, admin_token: str):
    """Test dashboard stats, risk analytics, audit logs, and settings endpoints."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Dashboard Stats
    stats_resp = await async_client.get("/api/v1/dashboard/stats", headers=headers)
    assert stats_resp.status_code == 200
    assert "stats" in stats_resp.json()
    assert "risk_distribution" in stats_resp.json()

    # Risk Analytics
    analytics_resp = await async_client.get("/api/v1/dashboard/risk-analytics", headers=headers)
    assert analytics_resp.status_code == 200
    assert "risk_by_country" in analytics_resp.json()

    # Audit Logs
    audit_resp = await async_client.get("/api/v1/dashboard/audit-log", headers=headers)
    assert audit_resp.status_code == 200
    assert "items" in audit_resp.json()

    # Settings
    settings_resp = await async_client.get("/api/v1/settings", headers=headers)
    assert settings_resp.status_code == 200


@pytest.mark.asyncio
async def test_404_handler_diagnostics(async_client: AsyncClient):
    """Test 404 custom JSON response and hint diagnostics."""
    resp = await async_client.get("/api/v1/non-existent-route-12345")
    assert resp.status_code == 404
    data = resp.json()
    assert "detail" in data
    assert "Route not found" in data["detail"]
