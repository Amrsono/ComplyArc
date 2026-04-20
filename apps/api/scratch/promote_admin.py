import asyncio
from sqlalchemy import update
from app.db.base import async_session_factory
from app.models.user import User

async def promote():
    async with async_session_factory() as db:
        await db.execute(update(User).where(User.email == 'admin@arc.com').values(role='admin'))
        await db.commit()
        print('User admin@arc.com promoted to admin role')

if __name__ == "__main__":
    asyncio.run(promote())
