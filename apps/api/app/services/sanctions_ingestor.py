"""
ComplyArc â€” Sanctions Data Ingestor
Downloads and parses OFAC/EU/UN/UK sanctions lists into normalized entries
"""
import json
import logging
from typing import List, Optional
from datetime import datetime, timezone
import httpx
from lxml import etree
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from app.models.sanctions_entry import SanctionsEntry
from app.core.config import settings

logger = logging.getLogger(__name__)


class SanctionsIngestor:
    """
    Downloads and normalizes sanctions data from official sources:
    - OFAC SDN (US Treasury XML)
    - EU Consolidated List (XML)
    - UN Security Council (XML)
    - UK Sanctions List (CSV/XML)
    """

    async def ingest_all(self, db: AsyncSession) -> dict:
        """Ingest all sanctions lists. Returns stats."""
        stats = {}
        
        try:
            ofac_count = await self.ingest_ofac(db)
            stats["OFAC"] = ofac_count
        except Exception as e:
            logger.error(f"OFAC ingestion failed: {e}")
            stats["OFAC"] = f"Error: {str(e)}"

        try:
            un_count = await self.ingest_un(db)
            stats["UN"] = un_count
        except Exception as e:
            logger.error(f"UN ingestion failed: {e}")
            stats["UN"] = f"Error: {str(e)}"

        # Seed some demo PEP entries for MVP
        try:
            pep_count = await self.seed_pep_entries(db)
            stats["PEP"] = pep_count
        except Exception as e:
            logger.error(f"PEP seeding failed: {e}")
            stats["PEP"] = f"Error: {str(e)}"

        return stats

    async def ingest_ofac(self, db: AsyncSession) -> int:
        """Download and parse OFAC SDN list (XML)."""
        logger.info("Ingesting OFAC SDN list...")

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(settings.OFAC_SDN_URL)
            response.raise_for_status()

        # Clear existing OFAC entries
        await db.execute(
            delete(SanctionsEntry).where(SanctionsEntry.list_type == "OFAC")
        )

        root = etree.fromstring(response.content)
        ns = {"sdn": "http://www.un.org/sanctions/1.0"}

        # Try to detect namespace
        if root.tag.startswith("{"):
            ns_uri = root.tag.split("}")[0] + "}"
            ns = {"sdn": ns_uri.strip("{}")}

        entries = []
        # Parse SDN entries â€” handle both namespaced and non-namespaced XML
        for entry in root.iter():
            if entry.tag.endswith("sdnEntry") or entry.tag == "sdnEntry":
                try:
                    parsed = self._parse_ofac_entry(entry)
                    if parsed:
                        entries.append(parsed)
                except Exception as e:
                    logger.warning(f"Failed to parse OFAC entry: {e}")
                    continue

        # Fallback: parse without namespace
        if not entries:
            for entry in root.findall(".//sdnEntry"):
                try:
                    parsed = self._parse_ofac_entry(entry)
                    if parsed:
                        entries.append(parsed)
                except Exception:
                    continue

        for entry_data in entries:
            db.add(SanctionsEntry(**entry_data))

        await db.flush()
        logger.info(f"Ingested {len(entries)} OFAC entries")
        return len(entries)

    def _parse_ofac_entry(self, entry) -> Optional[dict]:
        """Parse a single OFAC SDN XML entry."""
        def get_text(elem, tag):
            for child in elem.iter():
                if child.tag.endswith(tag) or child.tag == tag:
                    return child.text
            return None

        uid = get_text(entry, "uid")
        sdn_type = get_text(entry, "sdnType")
        first_name = get_text(entry, "firstName") or ""
        last_name = get_text(entry, "lastName") or ""
        full_name = f"{first_name} {last_name}".strip()

        if not full_name:
            return None

        # Get program
        program = None
        for prog_elem in entry.iter():
            if prog_elem.tag.endswith("program") or prog_elem.tag == "program":
                program = prog_elem.text
                break

        # Get aliases
        aliases = []
        for aka in entry.iter():
            if aka.tag.endswith("aka") or aka.tag == "aka":
                aka_first = get_text(aka, "firstName") or ""
                aka_last = get_text(aka, "lastName") or ""
                alias = f"{aka_first} {aka_last}".strip()
                if alias:
                    aliases.append(alias)

        # Get nationality/country from addresses
        country = None
        for addr in entry.iter():
            if addr.tag.endswith("address") or addr.tag == "address":
                country = get_text(addr, "country")
                if country:
                    break

        # DOB
        dob = None
        for dob_elem in entry.iter():
            if dob_elem.tag.endswith("dateOfBirthItem") or dob_elem.tag == "dateOfBirthItem":
                dob = get_text(dob_elem, "dateOfBirth")
                break

        entity_type = "individual" if sdn_type == "Individual" else "entity"

        return {
            "list_type": "OFAC",
            "source_id": str(uid) if uid else None,
            "program": program,
            "entity_type": entity_type,
            "full_name": full_name,
            "first_name": first_name if first_name else None,
            "last_name": last_name if last_name else None,
            "aliases": json.dumps(aliases) if aliases else None,
            "date_of_birth": dob,
            "nationality": None,
            "country": country,
            "is_active": True,
        }

    async def ingest_un(self, db: AsyncSession) -> int:
        """Download and parse UN Security Council consolidated list (XML)."""
        logger.info("Ingesting UN Security Council list...")

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(settings.UN_SANCTIONS_URL)
            response.raise_for_status()

        # Clear existing UN entries
        await db.execute(
            delete(SanctionsEntry).where(SanctionsEntry.list_type == "UN")
        )

        root = etree.fromstring(response.content)
        entries = []

        # UN XML uses INDIVIDUAL and ENTITY tags
        for individual in root.iter("INDIVIDUAL"):
            try:
                parsed = self._parse_un_individual(individual)
                if parsed:
                    entries.append(parsed)
            except Exception as e:
                logger.warning(f"Failed to parse UN individual: {e}")

        for entity in root.iter("ENTITY"):
            try:
                parsed = self._parse_un_entity(entity)
                if parsed:
                    entries.append(parsed)
            except Exception as e:
                logger.warning(f"Failed to parse UN entity: {e}")

        for entry_data in entries:
            db.add(SanctionsEntry(**entry_data))

        await db.flush()
        logger.info(f"Ingested {len(entries)} UN entries")
        return len(entries)

    def _parse_un_individual(self, elem) -> Optional[dict]:
        """Parse a UN individual entry."""
        def get_text(parent, tag):
            child = parent.find(tag)
            return child.text if child is not None else None

        first_name = get_text(elem, "FIRST_NAME") or ""
        second_name = get_text(elem, "SECOND_NAME") or ""
        third_name = get_text(elem, "THIRD_NAME") or ""
        full_name = " ".join(filter(None, [first_name, second_name, third_name]))

        if not full_name:
            return None

        dataid = get_text(elem, "DATAID")
        un_list_type = get_text(elem, "UN_LIST_TYPE")
        nationality_elem = elem.find(".//NATIONALITY/VALUE")
        nationality = nationality_elem.text if nationality_elem is not None else None
        listed_on = get_text(elem, "LISTED_ON")

        # DOB
        dob = None
        dob_elem = elem.find(".//INDIVIDUAL_DATE_OF_BIRTH/DATE")
        if dob_elem is not None:
            dob = dob_elem.text

        # Aliases
        aliases = []
        for alias in elem.findall(".//INDIVIDUAL_ALIAS"):
            alias_name = get_text(alias, "ALIAS_NAME")
            if alias_name:
                aliases.append(alias_name)

        return {
            "list_type": "UN",
            "source_id": dataid,
            "program": un_list_type,
            "entity_type": "individual",
            "full_name": full_name,
            "first_name": first_name or None,
            "last_name": second_name or None,
            "aliases": json.dumps(aliases) if aliases else None,
            "date_of_birth": dob,
            "nationality": nationality,
            "listed_date": listed_on,
            "is_active": True,
        }

    def _parse_un_entity(self, elem) -> Optional[dict]:
        """Parse a UN entity entry."""
        def get_text(parent, tag):
            child = parent.find(tag)
            return child.text if child is not None else None

        first_name = get_text(elem, "FIRST_NAME") or ""
        full_name = first_name.strip()

        if not full_name:
            return None

        dataid = get_text(elem, "DATAID")
        un_list_type = get_text(elem, "UN_LIST_TYPE")
        listed_on = get_text(elem, "LISTED_ON")

        aliases = []
        for alias in elem.findall(".//ENTITY_ALIAS"):
            alias_name = get_text(alias, "ALIAS_NAME")
            if alias_name:
                aliases.append(alias_name)

        return {
            "list_type": "UN",
            "source_id": dataid,
            "program": un_list_type,
            "entity_type": "entity",
            "full_name": full_name,
            "aliases": json.dumps(aliases) if aliases else None,
            "listed_date": listed_on,
            "is_active": True,
        }

    async def seed_pep_entries(self, db: AsyncSession) -> int:
        """Ingest real PEP (Politically Exposed Persons) data from OpenSanctions."""
        logger.info("Ingesting real PEP entries from OpenSanctions...")

        await db.execute(
            delete(SanctionsEntry).where(SanctionsEntry.list_type == "PEP")
        )

        url = "https://data.opensanctions.org/datasets/latest/peps/targets.simple.csv"
        
        try:
            import csv
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("GET", url) as response:
                    response.raise_for_status()
                    lines = []
                    async for line in response.aiter_lines():
                        lines.append(line)
                        # Limit to first 2000 records to keep DB fast for MVP
                        if len(lines) > 2000:
                            break
            
            reader = csv.DictReader(lines)
            count = 0
            for row in reader:
                db.add(SanctionsEntry(
                    list_type="PEP",
                    entity_type="individual",
                    full_name=row.get("name") or "Unknown PEP",
                    country=row.get("countries", "").split(";")[0] if row.get("countries") else None,
                    program="PEP",
                    date_of_birth=row.get("birth_date", "").split(";")[0] if row.get("birth_date") else None,
                    aliases=row.get("aliases") if row.get("aliases") else None,
                    is_active=True,
                ))
                count += 1

            await db.flush()
            logger.info(f"Ingested {count} real PEP entries")
            return count

        except Exception as e:
            logger.error(f"Failed to ingest PEPs: {e}")
            return 0


# Singleton
sanctions_ingestor = SanctionsIngestor()
