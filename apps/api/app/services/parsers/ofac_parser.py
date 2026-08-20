"""
OFAC SDN XML Parser
Extracts sanctioned individuals, corporates, aliases, programs, and IDs from US Treasury XML.
"""
import json
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


def parse_ofac_entry(entry) -> Optional[dict]:
    """Parse a single OFAC SDN XML element into a normalized dictionary."""
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
        if addr.tag.endswith("country") or addr.tag == "country":
            country = addr.text
            break

    # Get date of birth
    dob = None
    for dob_elem in entry.iter():
        if dob_elem.tag.endswith("dateOfBirth") or dob_elem.tag == "dateOfBirth":
            dob = dob_elem.text
            break

    # Get identification numbers
    id_number = None
    for id_elem in entry.iter():
        if id_elem.tag.endswith("idNumber") or id_elem.tag == "idNumber":
            id_number = id_elem.text
            break

    entity_type = "individual" if (sdn_type and "individual" in sdn_type.lower()) else "corporate"

    return {
        "source_id": str(uid) if uid else f"OFAC-{full_name[:20]}",
        "list_type": "OFAC",
        "full_name": full_name,
        "first_name": first_name or None,
        "last_name": last_name or None,
        "aliases": json.dumps(aliases) if aliases else None,
        "entity_type": entity_type,
        "date_of_birth": dob,
        "country": country,
        "program": program,
        "id_numbers": json.dumps([id_number]) if id_number else None,
        "is_active": True,
        "raw_data": json.dumps({"uid": uid, "sdnType": sdn_type, "program": program}),
    }


def parse_ofac_xml(xml_content: bytes | str) -> List[dict]:
    """Parse complete OFAC XML payload into a list of normalized entry dicts."""
    from lxml import etree

    if isinstance(xml_content, str):
        xml_content = xml_content.encode("utf-8")

    root = etree.fromstring(xml_content)
    entries = []

    for entry in root.iter():
        if entry.tag.endswith("sdnEntry") or entry.tag == "sdnEntry":
            try:
                parsed = parse_ofac_entry(entry)
                if parsed:
                    entries.append(parsed)
            except Exception as e:
                logger.warning(f"Failed to parse OFAC entry: {e}")
                continue

    if not entries:
        for entry in root.findall(".//sdnEntry"):
            try:
                parsed = parse_ofac_entry(entry)
                if parsed:
                    entries.append(parsed)
            except Exception:
                continue

    return entries
