"""
Unit and integration tests for Case Management and Compliance Audit Logging
"""
import pytest
from app.services.case_service import case_service
from app.services.audit_service import audit_service
from app.models.client import Client
from app.models.case import Case, CaseStatus, CasePriority
from app.schemas.case import CaseCreateRequest, CaseUpdateRequest, CaseNoteRequest


@pytest.mark.asyncio
async def test_case_lifecycle(db_session, test_analyst_user):
    """Test case creation, sequential numbering, status updates, notes, and closing."""
    # 1. Setup client
    client = Client(name="Suspicious Trader Corp", country="CY", type="corporate")
    db_session.add(client)
    await db_session.commit()
    await db_session.refresh(client)

    # 2. Create case
    case_req = CaseCreateRequest(
        client_id=client.id,
        title="Potential Sanction Evasion Investigation",
        description="High volume transfers to high risk jurisdiction",
        case_type="sanctions_match",
        priority=CasePriority.HIGH,
        assigned_to=test_analyst_user.id,
    )
    case = await case_service.create_case(db_session, case_req, created_by=test_analyst_user.id)
    await db_session.commit()

    assert case.id is not None
    assert case.case_number.startswith("CX-")
    assert case.status == CaseStatus.OPEN
    assert case.priority == CasePriority.HIGH

    # 3. Add note
    note_req = CaseNoteRequest(
        content="Requested additional invoices from the client.",
        note_type="comment",
    )
    note = await case_service.add_note(db_session, case.id, note_req, author_id=test_analyst_user.id)
    await db_session.commit()

    assert note.id is not None
    assert note.content == "Requested additional invoices from the client."

    notes = await case_service.get_notes(db_session, case.id)
    assert len(notes) >= 1

    # 4. Update case status to closed
    update_req = CaseUpdateRequest(
        status=CaseStatus.CLOSED,
        resolution="Legitimate trade transactions verified with customs documentation.",
    )
    updated_case = await case_service.update_case(db_session, case.id, update_req)
    await db_session.commit()

    assert updated_case.status == CaseStatus.CLOSED
    assert updated_case.closed_at is not None
    assert "Legitimate trade" in updated_case.resolution


@pytest.mark.asyncio
async def test_case_service_stats_and_list(db_session, test_analyst_user):
    """Test case statistics and paginated filtering."""
    client = Client(name="Acme Alpha", country="US")
    db_session.add(client)
    await db_session.commit()
    await db_session.refresh(client)

    case1 = await case_service.create_case(
        db_session,
        CaseCreateRequest(client_id=client.id, title="Case 1", case_type="pep_match", priority="medium"),
    )
    case2 = await case_service.create_case(
        db_session,
        CaseCreateRequest(client_id=client.id, title="Case 2", case_type="adverse_media", priority="high"),
    )
    await db_session.commit()

    stats = await case_service.get_stats(db_session)
    assert stats["active"] >= 2

    case_list = await case_service.list_cases(db_session, client_id=client.id)
    assert case_list.total >= 2


@pytest.mark.asyncio
async def test_audit_trail_logging(db_session, test_admin_user):
    """Test immutable compliance audit logging."""
    entry = await audit_service.log(
        db_session,
        action="risk_score_override",
        resource_type="client",
        resource_id="client-uuid-456",
        user_id=test_admin_user.id,
        user_email=test_admin_user.email,
        description="Senior Compliance Officer approved override due to low transaction volume",
        old_value={"risk_score": 4.5},
        new_value={"risk_score": 2.0},
        ip_address="192.168.1.100",
        metadata={"ticket": "JIRA-AML-492"},
    )
    await db_session.commit()

    assert entry.id is not None
    assert entry.action == "risk_score_override"
    assert entry.created_at is not None

    logs = await audit_service.list_logs(db_session, action="risk_score_override")
    assert logs.total >= 1
    assert logs.items[0].action == "risk_score_override"
