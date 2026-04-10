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

    # Seed demo clients
    from app.models.client import Client
    client_count = await db.scalar(select(func.count(Client.id)))
    if not client_count:
        from sqlalchemy import func
        demo_clients = [
            Client(name="ABC Trading LLC", type="corporate", status="active",
                   country="AE", industry="Trade Finance", risk_score=4.2, risk_level="high",
                   product_type="trade_finance", interface_type="intermediary",
                   onboarding_channel="remote"),
            Client(name="Global Investments Corp", type="corporate", status="active",
                   country="GB", industry="Financial Services", risk_score=2.8, risk_level="medium",
                   product_type="securities", interface_type="direct",
                   onboarding_channel="face_to_face"),
            Client(name="John Smith", type="individual", status="active",
                   first_name="John", last_name="Smith", date_of_birth="1975-03-15",
                   nationality="US", country="US", risk_score=1.5, risk_level="low",
                   product_type="advisory", interface_type="direct",
                   onboarding_channel="face_to_face"),
            Client(name="Maria Gonzalez", type="individual", status="pending",
                   first_name="Maria", last_name="Gonzalez", date_of_birth="1988-07-22",
                   nationality="ES", country="ES", risk_score=None, risk_level=None,
                   product_type="consulting"),
            Client(name="Dragon Holdings Ltd", type="corporate", status="active",
                   country="HK", industry="Holding Company", risk_score=3.6, risk_level="medium",
                   product_type="trust_services", interface_type="intermediary",
                   onboarding_channel="remote"),
            Client(name="Pacific Ventures KK", type="corporate", status="dormant",
                   country="JP", industry="Venture Capital", risk_score=2.1, risk_level="low",
                   product_type="advisory", interface_type="direct"),
            Client(name="Sahara Mining Co", type="corporate", status="suspended",
                   country="ZA", industry="Mining", risk_score=4.7, risk_level="high",
                   product_type="cash_services", interface_type="intermediary",
                   onboarding_channel="remote"),
            Client(name="Ahmed Al-Rashid", type="individual", status="active",
                   first_name="Ahmed", last_name="Al-Rashid", date_of_birth="1965-11-03",
                   nationality="SA", country="SA", risk_score=3.9, risk_level="medium",
                   pep_status=True, product_type="private_banking"),
        ]
        for c in demo_clients:
            db.add(c)
        await db.flush()
        logger.info(f"Seeded {len(demo_clients)} demo clients")


async def create_tables():
    """Create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")
