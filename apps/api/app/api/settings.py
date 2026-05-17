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
    
    result = await db.execute(select(SystemSettings))
    settings_records = result.scalars().all()
    
    from app.core.config import settings
    
    # We might want to ensure default keys exist in the response even if not in DB yet
    defaults = {
        "news_api_key": ("News API Key for Adverse Media Search", settings.NEWS_API_KEY),
        "openai_api_key": ("OpenAI API Key for AI Analysis", settings.OPENAI_API_KEY),
    }
    
    # Create missing ones in DB or just return them
    existing_keys = {s.key: s for s in settings_records}
    for k, (desc, env_val) in defaults.items():
        if k not in existing_keys:
            new_setting = SystemSettings(key=k, value=env_val, description=desc, is_secret=True)
            db.add(new_setting)
            settings_records.append(new_setting)
        else:
            setting = existing_keys[k]
            # Backfill from env var if currently empty
            if not setting.value and env_val:
                setting.value = env_val
    
    await db.commit()
    
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
