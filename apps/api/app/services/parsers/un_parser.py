"""
UN Consolidated Sanctions XML Parser
Parses INDIVIDUAL and ENTITY nodes from UN Security Council XML feeds.
"""
import json
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


def parse_un_individual(elem) -> Optional[dict]:
    """Parse a UN individual entry element."""
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

    dob = None
    dob_elem = elem.find(".//INDIVIDUAL_DATE_OF_BIRTH/DATE")
    if dob_elem is not None:
        dob = dob_elem.text

    aliases = []
    for alias in elem.findall(".//INDIVIDUAL_ALIAS"):
        alias_name = get_text(alias, "ALIAS_NAME")
        if alias_name:
            aliases.append(alias_name)

    return {
        "list_type": "UN",
        "source_id": str(dataid) if dataid else f"UN-{full_name[:20]}",
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


def parse_un_entity(elem) -> Optional[dict]:
    """Parse a UN corporate/entity entry element."""
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
        "source_id": str(dataid) if dataid else f"UN-{full_name[:20]}",
        "program": un_list_type,
        "entity_type": "corporate",
        "full_name": full_name,
        "aliases": json.dumps(aliases) if aliases else None,
        "listed_date": listed_on,
        "is_active": True,
    }


def parse_un_xml(xml_content: bytes | str) -> List[dict]:
    """Parse complete UN XML payload into a list of normalized entry dicts."""
    from lxml import etree

    if isinstance(xml_content, str):
        xml_content = xml_content.encode("utf-8")

    root = etree.fromstring(xml_content)
    entries = []

    for individual in root.iter("INDIVIDUAL"):
        try:
            parsed = parse_un_individual(individual)
            if parsed:
                entries.append(parsed)
        except Exception as e:
            logger.warning(f"Failed to parse UN individual: {e}")

    for entity in root.iter("ENTITY"):
        try:
            parsed = parse_un_entity(entity)
            if parsed:
                entries.append(parsed)
        except Exception as e:
            logger.warning(f"Failed to parse UN entity: {e}")

    return entries
