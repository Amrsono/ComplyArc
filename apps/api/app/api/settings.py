"""
ComplyArc â€” Settings API Routes
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.base import get_db
from app.models.user import User
from app.models.system_settings import SystemSettings
from app.core.deps import get_current_user

router = APIRouter()

class SettingUpdate(BaseModel):
    value: str

class SettingResponse(BaseModel):
    key: str
    value: str | None = None
    description: str | None = None
    is_secret: bool

    class Config:
        orm_mode = True

@router.get("/", response_model=List[SettingResponse])
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all system settings (admin only). Secrets are masked."""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    from app.core.config import settings as app_settings

    defaults = {
        "news_api_key": ("News API Key for Adverse Media Search", app_settings.NEWS_API_KEY),
        "openai_api_key": ("OpenAI API Key for AI Analysis", app_settings.OPENAI_API_KEY),
    }

    async def _load_and_seed(session: AsyncSession):
        result = await session.execute(select(SystemSettings))
        settings_records = list(result.scalars().all())

        existing_keys = {s.key: s for s in settings_records}
        for k, (desc, env_val) in defaults.items():
            if k not in existing_keys:
                new_setting = SystemSettings(key=k, value=env_val, description=desc, is_secret=True)
                session.add(new_setting)
                settings_records.append(new_setting)
            else:
                setting = existing_keys[k]
                if not setting.value and env_val:
                    setting.value = env_val

        await session.commit()
        return settings_records

    try:
        settings_records = await _load_and_seed(db)
    except Exception as e:
        err_str = str(e).lower()
        # Table missing — create it then retry with a fresh session
        if "does not exist" in err_str or "no such table" in err_str or "undefined" in err_str:
            import logging
            logging.getLogger(__name__).warning("system_settings table missing — creating now...")
            from app.db.init_db import create_tables
            await create_tables()
            # Retry with a fresh session
            from app.db.base import async_session_factory
            async with async_session_factory() as fresh_db:
                settings_records = await _load_and_seed(fresh_db)
        else:
            raise HTTPException(status_code=500, detail=f"Failed to load settings: {str(e)}")

    # Mask secrets
    response = []
    for s in settings_records:
        masked_val = "********" if s.is_secret and s.value else s.value
        response.append(SettingResponse(
            key=s.key,
            value=masked_val,
            description=s.description,
            is_secret=s.is_secret
        ))
        
    return response

@router.put("/{key}", response_model=SettingResponse)
async def update_setting(
    key: str,
    setting_update: SettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a specific system setting."""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    result = await db.execute(select(SystemSettings).where(SystemSettings.key == key))
    setting = result.scalar_one_or_none()
    
    if not setting:
        # Create it if it doesn't exist
        setting = SystemSettings(key=key, value=setting_update.value, is_secret=True)
        db.add(setting)
    else:
        # Only update if the value is not the masked string
        if setting_update.value != "********":
            setting.value = setting_update.value
            
    await db.commit()
    await db.refresh(setting)
    
    masked_val = "********" if setting.is_secret and setting.value else setting.value
    return SettingResponse(
        key=setting.key,
        value=masked_val,
        description=setting.description,
        is_secret=setting.is_secret
    )
