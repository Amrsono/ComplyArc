"""
ComplyArc â€” Risk Engine Service
Multi-factor risk scoring: CRR (0.4) + GRR (0.2) + PRR (0.2) + IRR (0.2)
"""
import json
from typing import List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.risk_score import RiskScore
from app.models.client import Client
from app.models.screening import ScreeningResult
from app.models.adverse_media import AdverseMedia
from app.models.ubo import UBO
from app.schemas.risk import RiskCalculateRequest, RiskResponse, RiskBreakdown, RiskFactorDetail


# â”€â”€â”€ FATF High-Risk / Monitored Jurisdictions â”€â”€â”€â”€
FATF_BLACKLIST = {"KP", "IR", "MM"}  # North Korea, Iran, Myanmar
FATF_GREYLIST = {
    "BF", "CM", "CD", "HR", "HT", "KE", "ML", "MZ", "NG", "PH",
    "SN", "ZA", "SS", "SY", "TZ", "VN", "YE",
}
HIGH_CORRUPTION_COUNTRIES = {
    "SO", "SY", "SS", "VE", "YE", "KP", "AF", "LY", "GQ", "TD",
    "ER", "IQ", "TM", "HT", "BI", "CF",
}

# â”€â”€â”€ Product Risk Mappings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
HIGH_RISK_PRODUCTS = {
    "cash_services", "money_transfer", "trade_finance", "correspondent_banking",
    "private_banking", "shell_company", "trust_services", "crypto_exchange",
    "virtual_assets", "precious_metals",
}
MEDIUM_RISK_PRODUCTS = {
    "corporate_formation", "real_estate", "insurance", "securities",
    "lending", "factoring", "leasing",
}
LOW_RISK_PRODUCTS = {
    "advisory", "audit", "tax_advisory", "legal_advisory", "consulting",
    "accounting", "payroll",
}


class RiskEngine:
    """
    Multi-factor risk scoring engine with explainable output.
    
    Formula: Total = (0.4 Ã— CRR) + (0.2 Ã— GRR) + (0.2 Ã— PRR) + (0.2 Ã— IRR)
    Each factor scored 1-5.
    """

    WEIGHT_CLIENT = 0.40
    WEIGHT_GEOGRAPHY = 0.20
    WEIGHT_PRODUCT = 0.20
    WEIGHT_INTERFACE = 0.20

    async def calculate_client_risk(
        self, db: AsyncSession, client: Client
    ) -> Tuple[float, List[str]]:
        """Calculate Client Risk Rating (CRR) â€” 1 to 5."""
        score = 1.0
        factors = []

        # Check sanctions hits
        sanctions_count = await db.scalar(
            select(func.count(ScreeningResult.id)).where(
                ScreeningResult.client_id == client.id,
                ScreeningResult.match_confidence.in_(["high", "medium"]),
                ScreeningResult.decision != "false_positive",
            )
        )
        if sanctions_count and sanctions_count > 0:
            score += min(sanctions_count * 1.5, 3.0)
            factors.append(f"{sanctions_count} sanctions match(es)")

        # Check PEP status
        if client.pep_status:
            score += 1.5
            factors.append("PEP status identified")

        # Check adverse media
        media_count = await db.scalar(
            select(func.count(AdverseMedia.id)).where(
                AdverseMedia.client_id == client.id,
                AdverseMedia.severity.in_(["high", "critical"]),
            )
        )
        if media_count and media_count > 0:
            score += min(media_count * 0.8, 2.0)
            factors.append(f"{media_count} high-severity adverse media hit(s)")

        # Check UBO complexity (corporate only)
        if client.type == "corporate":
            ubo_count = await db.scalar(
                select(func.count(UBO.id)).where(UBO.client_id == client.id)
            )
            ubo_risk_count = await db.scalar(
                select(func.count(UBO.id)).where(
                    UBO.client_id == client.id, UBO.risk_flag == True
                )
            )
            if ubo_count and ubo_count > 3:
                score += 0.5
                factors.append(f"Complex ownership ({ubo_count} UBOs)")
            if ubo_risk_count and ubo_risk_count > 0:
                score += 1.0
                factors.append(f"{ubo_risk_count} UBO(s) with risk flags")

        if not factors:
            factors.append("No risk factors identified")

        return (min(max(score, 1.0), 5.0), factors)

    def calculate_geography_risk(self, client: Client) -> Tuple[float, List[str]]:
        """Calculate Geography Risk Rating (GRR) â€” 1 to 5."""
        score = 1.0
        factors = []
        country = (client.country or client.nationality or client.incorporation_country or "").upper()

        if not country:
            factors.append("Country not specified â€” default low risk")
            return (1.0, factors)

        if country in FATF_BLACKLIST:
            score = 5.0
            factors.append(f"Country {country} on FATF blacklist")
        elif country in FATF_GREYLIST:
            score = max(score, 4.0)
            factors.append(f"Country {country} on FATF grey list (monitoring)")
        elif country in HIGH_CORRUPTION_COUNTRIES:
            score = max(score, 3.5)
            factors.append(f"Country {country} has high corruption index")
        else:
            factors.append(f"Country {country} â€” standard risk jurisdiction")

        return (min(max(score, 1.0), 5.0), factors)

    def calculate_product_risk(self, client: Client) -> Tuple[float, List[str]]:
        """Calculate Product Risk Rating (PRR) â€” 1 to 5."""
        product = (client.product_type or "").lower().replace(" ", "_")
        factors = []

        if not product:
            factors.append("Product type not specified â€” default low risk")
            return (1.0, factors)

        if product in HIGH_RISK_PRODUCTS:
            factors.append(f"High-risk product: {client.product_type}")
            return (5.0, factors)
        elif product in MEDIUM_RISK_PRODUCTS:
            factors.append(f"Medium-risk product: {client.product_type}")
            return (3.0, factors)
        elif product in LOW_RISK_PRODUCTS:
            factors.append(f"Low-risk product: {client.product_type}")
            return (1.0, factors)
        else:
            factors.append(f"Product type: {client.product_type} â€” default medium risk")
            return (2.5, factors)

    def calculate_interface_risk(self, client: Client) -> Tuple[float, List[str]]:
        """Calculate Interface Risk Rating (IRR) â€” 1 to 5."""
        score = 1.0
        factors = []

        interface = (client.interface_type or "").lower()
        channel = (client.onboarding_channel or "").lower()

        if interface == "intermediary":
            score += 1.5
            factors.append("Client onboarded via intermediary")
        elif interface == "direct":
            factors.append("Direct client relationship")

        if channel == "remote" or channel == "online":
            score += 1.0
            factors.append("Remote/online onboarding (non face-to-face)")
        elif channel == "face_to_face":
            factors.append("Face-to-face onboarding")
        else:
            score += 0.5
            factors.append("Onboarding channel not specified")

        if not factors:
            factors.append("Standard interface risk")

        return (min(max(score, 1.0), 5.0), factors)

    async def calculate_risk(
        self,
        db: AsyncSession,
        request: RiskCalculateRequest,
        calculated_by: Optional[str] = None,
    ) -> RiskResponse:
        """
        Calculate complete risk score for a client.
        Returns explainable breakdown.
        """
        # Fetch client
        result = await db.execute(
            select(Client).where(Client.id == request.client_id)
        )
        client = result.scalar_one_or_none()
        if not client:
            raise ValueError(f"Client {request.client_id} not found")

        # Calculate each factor
        if request.client_risk_override is not None:
            crr = request.client_risk_override
            crr_factors = ["Manual override applied"]
        else:
            crr, crr_factors = await self.calculate_client_risk(db, client)

        if request.geography_risk_override is not None:
            grr = request.geography_risk_override
            grr_factors = ["Manual override applied"]
        else:
            grr, grr_factors = self.calculate_geography_risk(client)

        if request.product_risk_override is not None:
            prr = request.product_risk_override
            prr_factors = ["Manual override applied"]
        else:
            prr, prr_factors = self.calculate_product_risk(client)

        if request.interface_risk_override is not None:
            irr = request.interface_risk_override
            irr_factors = ["Manual override applied"]
        else:
            irr, irr_factors = self.calculate_interface_risk(client)

        # Weighted total
        total = round(
            crr * self.WEIGHT_CLIENT
            + grr * self.WEIGHT_GEOGRAPHY
            + prr * self.WEIGHT_PRODUCT
            + irr * self.WEIGHT_INTERFACE,
            2,
        )

        # Risk level
        if total >= 4.0:
            risk_level = "high"
        elif total >= 2.5:
            risk_level = "medium"
        else:
            risk_level = "low"

        # Check for existing score version
        existing = await db.execute(
            select(func.max(RiskScore.version)).where(
                RiskScore.client_id == request.client_id
            )
        )
        current_version = existing.scalar() or 0

        # Save risk score
        risk_score = RiskScore(
            client_id=request.client_id,
            client_risk=crr,
            geography_risk=grr,
            product_risk=prr,
            interface_risk=irr,
            total_score=total,
            risk_level=risk_level,
            client_risk_factors=json.dumps(crr_factors),
            geography_risk_factors=json.dumps(grr_factors),
            product_risk_factors=json.dumps(prr_factors),
            interface_risk_factors=json.dumps(irr_factors),
            calculated_by=calculated_by,
            version=current_version + 1,
        )
        db.add(risk_score)

        # Update client risk
        client.risk_score = total
        client.risk_level = risk_level

        await db.flush()

        breakdown = RiskBreakdown(
            client_risk=RiskFactorDetail(score=crr, factors=crr_factors),
            geography_risk=RiskFactorDetail(score=grr, factors=grr_factors),
            product_risk=RiskFactorDetail(score=prr, factors=prr_factors),
            interface_risk=RiskFactorDetail(score=irr, factors=irr_factors),
        )

        return RiskResponse(
            id=risk_score.id,
            client_id=request.client_id,
            total_score=total,
            risk_level=risk_level,
            breakdown=breakdown,
            ai_summary=None,
            version=risk_score.version,
            calculated_at=risk_score.created_at,
        )


# Singleton
risk_engine = RiskEngine()
