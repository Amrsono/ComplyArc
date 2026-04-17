"""
ComplyArc â€” Database Initialization
Create tables and seed default data
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import engine, Base
from app.models import *  # noqa: Import all models
from app.core.security import hash_password
from app.models.user import User

logger = logging.getLogger(__name__)


async def init_db(db: AsyncSession):
    """Initialize database with default admin user."""
    from sqlalchemy import select

    # Check if admin exists
    result = await db.execute(select(User).where(User.email == "admin@complyarc.com"))
    admin = result.scalar_one_or_none()

    if not admin:
        admin = User(
            email="admin@complyarc.com",
            hashed_password=hash_password("admin123"),
            full_name="System Administrator",
            role="admin",
            organization="ComplyArc",
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        await db.flush()
        logger.info("Created default admin user: admin@complyarc.com / admin123")

    # Seed initial real clients for testing
    from app.models.client import Client
    from sqlalchemy import func
    client_count = await db.scalar(select(func.count(Client.id)))
    if not client_count:
        real_clients = [
            Client(name="Apple Inc.", type="corporate", status="active",
                   country="US", industry="Technology", risk_score=1.5, risk_level="low",
                   product_type="securities", interface_type="direct",
                   onboarding_channel="face_to_face"),
            Client(name="Tesla Motors, Inc.", type="corporate", status="active",
                   country="US", industry="Automotive", risk_score=2.8, risk_level="medium",
                   product_type="trade_finance", interface_type="intermediary",
                   onboarding_channel="remote"),
            Client(name="Elon Musk", type="individual", status="active",
                   first_name="Elon", last_name="Musk", date_of_birth="1971-06-28",
                   nationality="US", country="US", risk_score=4.2, risk_level="high",
                   product_type="advisory", interface_type="direct",
                   onboarding_channel="face_to_face", pep_status=False),
            Client(name="Microsoft Corporation", type="corporate", status="active",
                   country="US", industry="Technology", risk_score=1.2, risk_level="low",
                   product_type="securities"),
            Client(name="Binance Holdings Ltd", type="corporate", status="pending",
                   country="KY", industry="Cryptocurrency", risk_score=4.8, risk_level="high",
                   product_type="crypto_services", interface_type="remote",
                   onboarding_channel="digital"),
            Client(name="Vladimir Putin", type="individual", status="suspended",
                   first_name="Vladimir", last_name="Putin", date_of_birth="1952-10-07",
                   nationality="RU", country="RU", risk_score=5.0, risk_level="high",
                   pep_status=True, product_type="private_banking"),
            Client(name="Amazon.com, Inc.", type="corporate", status="active",
                   country="US", industry="Retail / Technology", risk_score=1.8, risk_level="low",
                   product_type="cash_services"),
        ]
        for c in real_clients:
            db.add(c)
        await db.flush()
        logger.info(f"Seeded {len(real_clients)} real-world example clients")


async def create_tables():
    """Create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")
