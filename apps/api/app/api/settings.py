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

# ── Schemas ──────────────────────────────────────────────────────────────────

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

def _env_defaults():
    """Return default setting definitions sourced from env vars."""
    from app.core.config import settings as cfg
    return {
        "news_api_key": {
            "description": "News API Key for Adverse Media Search",
            "value": cfg.NEWS_API_KEY or "",
            "is_secret": True,
        },
        "openai_api_key": {
            "description": "OpenAI API Key for AI Analysis",
            "value": cfg.OPENAI_API_KEY or "",
            "is_secret": True,
        },
    }

def _mask(value: str | None, is_secret: bool) -> str | None:
    if is_secret and value:
        return "********"
    return value

async def _ensure_table(db: AsyncSession):
    """Create system_settings table if it does not exist."""
    try:
        await db.execute(text(
            """
            CREATE TABLE IF NOT EXISTS system_settings (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT,
                description TEXT,
                is_secret BOOLEAN DEFAULT TRUE,
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
            """
        ))
        await db.commit()
    except Exception as e:
        logger.warning(f"Could not ensure system_settings table: {e}")
        await db.rollback()

# ── GET /settings/ ────────────────────────────────────────────────────────────

@router.get("/", response_model=List[SettingResponse])
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all system settings (admin only). Secrets are masked."""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    defaults = _env_defaults()

    # ── Step 1: ensure table exists ─────────────────────────────────────────
    await _ensure_table(db)

    # ── Step 2: load rows from DB ────────────────────────────────────────────
    db_rows: dict[str, dict] = {}
    try:
        rows = await db.execute(text("SELECT key, value, description, is_secret FROM system_settings"))
        for row in rows.mappings():
            db_rows[row["key"]] = dict(row)
    except Exception as e:
        logger.error(f"Failed to read system_settings from DB: {e}")
        # Non-fatal — fall through and use env defaults only

    # ── Step 3: upsert defaults if missing ───────────────────────────────────
    for key, meta in defaults.items():
        if key not in db_rows:
            try:
                await db.execute(
                    text(
                        """
                        INSERT INTO system_settings (key, value, description, is_secret)
                        VALUES (:key, :value, :description, :is_secret)
                        ON CONFLICT (key) DO NOTHING
                        """
                    ),
                    {"key": key, "value": meta["value"], "description": meta["description"], "is_secret": meta["is_secret"]},
                )
                await db.commit()
                db_rows[key] = {"key": key, **meta}
            except Exception as e:
                logger.warning(f"Could not upsert default setting {key}: {e}")
                await db.rollback()
                # Still add it to the response from env defaults
                db_rows[key] = {"key": key, **meta}
        else:
            # Backfill empty value from env var
            row = db_rows[key]
            if not row.get("value") and meta["value"]:
                try:
                    await db.execute(
                        text("UPDATE system_settings SET value = :val WHERE key = :key"),
                        {"val": meta["value"], "key": key},
                    )
                    await db.commit()
                    db_rows[key]["value"] = meta["value"]
                except Exception as e:
                    logger.warning(f"Could not backfill {key}: {e}")
                    await db.rollback()

    # ── Step 4: build response (always includes all defaults) ────────────────
    response = []
    for key, meta in defaults.items():
        row = db_rows.get(key, {"key": key, **meta})
        response.append(SettingResponse(
            key=key,
            value=_mask(row.get("value"), bool(row.get("is_secret", True))),
            description=row.get("description") or meta["description"],
            is_secret=bool(row.get("is_secret", True)),
        ))

    return response


# ── PUT /settings/{key} ───────────────────────────────────────────────────────

@router.put("/{key}", response_model=SettingResponse)
async def update_setting(
    key: str,
    setting_update: SettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a specific system setting (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if not setting_update.value or setting_update.value == "********":
        raise HTTPException(status_code=400, detail="Invalid value — cannot save empty or masked key.")

    await _ensure_table(db)

    defaults = _env_defaults()
    meta = defaults.get(key, {"description": f"System setting: {key}", "is_secret": True})

    try:
        await db.execute(
            text(
                """
                INSERT INTO system_settings (key, value, description, is_secret)
                VALUES (:key, :value, :description, :is_secret)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
                """
            ),
            {
                "key": key,
                "value": setting_update.value,
                "description": meta["description"],
                "is_secret": True,
            },
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update setting {key}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save setting: {str(e)}")

    return SettingResponse(
        key=key,
        value="********",
        description=meta["description"],
        is_secret=True,
    )
