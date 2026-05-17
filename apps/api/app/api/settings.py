"""
ComplyArc — Settings API Routes
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from pydantic import BaseModel

from app.db.base import get_db
from app.models.user import User
from app.core.deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────────────────────

class SettingUpdate(BaseModel):
    value: str

class SettingResponse(BaseModel):
    key: str
    value: str | None = None
    description: str | None = None
    is_secret: bool = True

    class Config:
        orm_mode = True

# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_defaults() -> List[SettingResponse]:
    """Always-safe fallback: return defaults sourced from env vars."""
    from app.core.config import settings as cfg
    return [
        SettingResponse(
            key="news_api_key",
            value="********" if cfg.NEWS_API_KEY else None,
            description="News API Key for Adverse Media Search",
            is_secret=True,
        ),
        SettingResponse(
            key="openai_api_key",
            value="********" if cfg.OPENAI_API_KEY else None,
            description="OpenAI API Key for AI Analysis",
            is_secret=True,
        ),
    ]

# ── GET /settings/ ────────────────────────────────────────────────────────────

@router.get("/settings", response_model=List[SettingResponse])
async def get_settings(
    current_user: User = Depends(get_current_user),
):
    """
    Get all system settings (admin only). Secrets are masked.
    NOTE: We do NOT use Depends(get_db) here so a DB connection failure
    cannot produce a 500 — we always return at least the env-var defaults.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    from app.core.config import settings as cfg

    env_values = {
        "news_api_key": cfg.NEWS_API_KEY or "",
        "openai_api_key": cfg.OPENAI_API_KEY or "",
    }
    descriptions = {
        "news_api_key": "News API Key for Adverse Media Search",
        "openai_api_key": "OpenAI API Key for AI Analysis",
    }

    db_rows: dict = {}

    try:
        from app.db.base import async_session_factory
        async with async_session_factory() as db:
            # Ensure table exists
            await db.execute(text("""
                CREATE TABLE IF NOT EXISTS system_settings (
                    key VARCHAR(100) PRIMARY KEY,
                    value TEXT,
                    description TEXT,
                    is_secret BOOLEAN DEFAULT TRUE,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            """))
            await db.commit()

            # Load all rows
            result = await db.execute(text(
                "SELECT key, value, description, is_secret FROM system_settings"
            ))
            for row in result.mappings():
                db_rows[row["key"]] = dict(row)

            # Upsert defaults if missing
            for key in env_values:
                if key not in db_rows:
                    await db.execute(text("""
                        INSERT INTO system_settings (key, value, description, is_secret)
                        VALUES (:key, :value, :desc, TRUE)
                        ON CONFLICT (key) DO NOTHING
                    """), {"key": key, "value": env_values[key], "desc": descriptions[key]})
                    db_rows[key] = {
                        "key": key,
                        "value": env_values[key],
                        "description": descriptions[key],
                        "is_secret": True,
                    }
                else:
                    # Backfill from env if DB value is empty
                    if not db_rows[key].get("value") and env_values[key]:
                        await db.execute(text(
                            "UPDATE system_settings SET value = :val WHERE key = :key"
                        ), {"val": env_values[key], "key": key})
                        db_rows[key]["value"] = env_values[key]

            await db.commit()

    except Exception as e:
        logger.error(f"[Settings GET] DB error (falling back to env defaults): {e}")
        # Populate from env so UI always has data
        for key in env_values:
            if key not in db_rows:
                db_rows[key] = {
                    "key": key,
                    "value": env_values[key],
                    "description": descriptions[key],
                    "is_secret": True,
                }

    # Build response — always include all default keys
    response = []
    for key in env_values:
        row = db_rows.get(key, {})
        val = row.get("value") or env_values.get(key) or ""
        response.append(SettingResponse(
            key=key,
            value="********" if val else None,
            description=row.get("description") or descriptions[key],
            is_secret=True,
        ))

    return response


# ── PUT /settings/{key} ───────────────────────────────────────────────────────

@router.put("/settings/{key}", response_model=SettingResponse)
async def update_setting(
    key: str,
    setting_update: SettingUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update a specific system setting (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if not setting_update.value or setting_update.value.strip() == "********":
        raise HTTPException(status_code=400, detail="Invalid value.")

    descriptions = {
        "news_api_key": "News API Key for Adverse Media Search",
        "openai_api_key": "OpenAI API Key for AI Analysis",
    }
    desc = descriptions.get(key, f"System setting: {key}")

    try:
        from app.db.base import async_session_factory
        async with async_session_factory() as db:
            await db.execute(text("""
                CREATE TABLE IF NOT EXISTS system_settings (
                    key VARCHAR(100) PRIMARY KEY,
                    value TEXT,
                    description TEXT,
                    is_secret BOOLEAN DEFAULT TRUE,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            """))
            await db.execute(text("""
                INSERT INTO system_settings (key, value, description, is_secret)
                VALUES (:key, :value, :desc, TRUE)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
            """), {"key": key, "value": setting_update.value.strip(), "desc": desc})
            await db.commit()
    except Exception as e:
        logger.error(f"[Settings PUT] DB error for key={key}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save setting: {str(e)}")

    return SettingResponse(
        key=key,
        value="********",
        description=desc,
        is_secret=True,
    )
