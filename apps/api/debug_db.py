import asyncio
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import async_session_factory
from app.models.sanctions_entry import SanctionsEntry
from app.services.sanctions_ingestor import sanctions_ingestor

logging.basicConfig(level=logging.INFO)

async def main():
    async with async_session_factory() as db:
        print("Ingesting...")
        await sanctions_ingestor.ingest_all(db)
        await db.commit()
        
        print("Done. Querying...")
        res = await db.execute(select(SanctionsEntry).where(SanctionsEntry.full_name.ilike('%putin%')))
        rows = res.scalars().all()
        print(f"Found {len(rows)} matching putin: {[r.full_name for r in rows]}")
        
        res = await db.execute(select(SanctionsEntry).limit(10))
        rows = res.scalars().all()
        print(f"First 10 entries: {[r.full_name for r in rows]}")

if __name__ == "__main__":
    asyncio.run(main())
