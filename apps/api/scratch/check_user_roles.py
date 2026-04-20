import asyncio
from sqlalchemy import select
from app.db.base import async_session_factory
from app.models.user import User

async def check_user():
    async with async_session_factory() as db:
        res = await db.execute(select(User).where(User.email == 'admin@arc.com'))
        user = res.scalar_one_or_none()
        if user:
            print(f"User: {user.email}, Role: {user.role}, Is Active: {user.is_active}")
        else:
            print("User admin@arc.com not found")

        # Also check all admins
        res = await db.execute(select(User).where(User.role == 'admin'))
        admins = res.scalars().all()
        print(f"Admins found: {[u.email for u in admins]}")

if __name__ == "__main__":
    asyncio.run(check_user())
