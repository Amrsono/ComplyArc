"""
ComplyArc — Pytest Configuration and Fixtures
Asynchronous SQLite in-memory test database and API test client fixtures
"""
import sys
import os
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Add apps/api to sys.path
API_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if API_DIR not in sys.path:
    sys.path.insert(0, API_DIR)

from app.db.base import Base, get_db
from app.core.config import settings
from app.core.security import hash_password, create_access_token, generate_api_key, hash_api_key
from app.models.user import User
from app.models.client import Client, ApiKey
from app.models.sanctions_entry import SanctionsEntry
from api.index import app

# In-memory SQLite async test database
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    echo=False,
    future=True,
)

TestingSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_test_db():
    """Create database tables once for the test session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a fresh transactional session for each test."""
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def test_admin_user(db_session: AsyncSession) -> User:
    """Create or get a default admin user."""
    from sqlalchemy import select
    res = await db_session.execute(select(User).where(User.email == "testadmin@complyarc.com"))
    admin = res.scalar_one_or_none()
    if not admin:
        admin = User(
            email="testadmin@complyarc.com",
            hashed_password=hash_password("adminSecret123!"),
            full_name="Test Administrator",
            role="admin",
            organization="ComplyArc QA",
            is_active=True,
            is_verified=True,
        )
        db_session.add(admin)
        await db_session.commit()
        await db_session.refresh(admin)
    return admin


@pytest_asyncio.fixture
async def test_analyst_user(db_session: AsyncSession) -> User:
    """Create or get a default analyst user."""
    from sqlalchemy import select
    res = await db_session.execute(select(User).where(User.email == "testanalyst@complyarc.com"))
    analyst = res.scalar_one_or_none()
    if not analyst:
        analyst = User(
            email="testanalyst@complyarc.com",
            hashed_password=hash_password("analystSecret123!"),
            full_name="Test Analyst",
            role="analyst",
            organization="ComplyArc QA",
            is_active=True,
            is_verified=True,
        )
        db_session.add(analyst)
        await db_session.commit()
        await db_session.refresh(analyst)
    return analyst


@pytest_asyncio.fixture
def admin_token(test_admin_user: User) -> str:
    """Generate JWT token for the admin user."""
    return create_access_token(
        data={"sub": test_admin_user.id, "email": test_admin_user.email, "role": test_admin_user.role}
    )


@pytest_asyncio.fixture
def analyst_token(test_analyst_user: User) -> str:
    """Generate JWT token for the analyst user."""
    return create_access_token(
        data={"sub": test_analyst_user.id, "email": test_analyst_user.email, "role": test_analyst_user.role}
    )


@pytest_asyncio.fixture
async def test_api_key(db_session: AsyncSession, test_admin_user: User) -> str:
    """Create an API key in the DB and return the raw key."""
    raw_key = generate_api_key()
    api_key_obj = ApiKey(
        user_id=test_admin_user.id,
        name="Test Suite API Key",
        key_hash=hash_api_key(raw_key),
        key_prefix=raw_key[:12],
        is_active=True,
    )
    db_session.add(api_key_obj)
    await db_session.commit()
    return raw_key


@pytest_asyncio.fixture
async def seed_sanctions(db_session: AsyncSession):
    """Seed test sanctions and PEP records."""
    entries = [
        SanctionsEntry(
            full_name="Vladimir Vladimirovich Putin",
            list_type="OFAC",
            source_id="OFAC-1001",
            entity_type="individual",
            date_of_birth="1952-10-07",
            nationality="RU",
            program="RUSSIA-EO14024",
            is_active=True,
            aliases='["Vladimir Putin", "Putin Vladimir"]'
        ),
        SanctionsEntry(
            full_name="Mohamed Ahmed Al-Mansoor",
            list_type="UN",
            source_id="UN-2002",
            entity_type="individual",
            date_of_birth="1980-05-15",
            nationality="SY",
            program="UN-TERRORISM",
            is_active=True,
            aliases='["Mohammed Al Mansoor", "Mohd Ahmed Mansour"]'
        ),
        SanctionsEntry(
            full_name="Cyber Threat Network LLC",
            list_type="EU",
            source_id="EU-3003",
            entity_type="corporate",
            nationality="KP",
            program="CYBER-SANCTIONS",
            is_active=True,
            aliases='["CTN Global", "Cyber Threat Group"]'
        ),
        SanctionsEntry(
            full_name="John Alexander Sterling",
            list_type="PEP",
            source_id="PEP-4004",
            entity_type="individual",
            date_of_birth="1965-03-22",
            nationality="GB",
            program="POLITICALLY_EXPOSED_PERSON",
            is_active=True,
            aliases='["John Sterling", "Alexander Sterling"]'
        ),
    ]
    for e in entries:
        db_session.add(e)
    await db_session.commit()


@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide an HTTPX AsyncClient with dependency overrides for FastAPI."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client

    app.dependency_overrides.clear()

