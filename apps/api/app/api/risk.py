"""
Cortex AML — Risk API Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.risk_score import RiskScore
from app.services.risk_engine import risk_engine
from app.services.audit_service import audit_service
from app.schemas.risk import RiskCalculateRequest, RiskResponse

router = APIRouter(prefix="/risk", tags=["Risk Scoring"])


@router.post("/calculate", response_model=RiskResponse)
async def calculate_risk(
    request: RiskCalculateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Calculate multi-factor risk score for a client.
    
    Returns explainable breakdown: CRR (0.4) + GRR (0.2) + PRR (0.2) + IRR (0.2)
    """
    try:
        result = await risk_engine.calculate_risk(db, request, calculated_by=user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    await audit_service.log(
        db,
        action="calculate_risk",
        resource_type="risk_score",
        resource_id=result.id,
        user_id=user.id,
        user_email=user.email,
        description=f"Risk calculation: score={result.total_score}, level={result.risk_level}",
    )

    return result


@router.get("/client/{client_id}", response_model=RiskResponse)
async def get_client_risk(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get the latest risk score for a client."""
    result = await db.execute(
        select(RiskScore)
        .where(RiskScore.client_id == client_id)
        .order_by(RiskScore.version.desc())
        .limit(1)
    )
    risk_score = result.scalar_one_or_none()

    if not risk_score:
        raise HTTPException(status_code=404, detail="No risk score found for this client")

    import json
    from app.schemas.risk import RiskBreakdown, RiskFactorDetail

    breakdown = RiskBreakdown(
        client_risk=RiskFactorDetail(
            score=risk_score.client_risk,
            factors=json.loads(risk_score.client_risk_factors or "[]"),
        ),
        geography_risk=RiskFactorDetail(
            score=risk_score.geography_risk,
            factors=json.loads(risk_score.geography_risk_factors or "[]"),
        ),
        product_risk=RiskFactorDetail(
            score=risk_score.product_risk,
            factors=json.loads(risk_score.product_risk_factors or "[]"),
        ),
        interface_risk=RiskFactorDetail(
            score=risk_score.interface_risk,
            factors=json.loads(risk_score.interface_risk_factors or "[]"),
        ),
    )

    return RiskResponse(
        id=risk_score.id,
        client_id=client_id,
        total_score=risk_score.total_score,
        risk_level=risk_score.risk_level,
        breakdown=breakdown,
        ai_summary=risk_score.ai_summary,
        version=risk_score.version,
        calculated_at=risk_score.created_at,
    )
