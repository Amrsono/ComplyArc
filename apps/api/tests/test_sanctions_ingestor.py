"""
Unit and integration tests for Sanctions Ingestor and OFAC/UN Parsers
"""
import os
import pytest
from sqlalchemy import select
from app.models.sanctions_entry import SanctionsEntry
from app.services.parsers.ofac_parser import parse_ofac_xml
from app.services.parsers.un_parser import parse_un_xml
from app.services.sanctions_ingestor import sanctions_ingestor

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


def test_parse_ofac_xml_from_static_fixture():
    with open(os.path.join(FIXTURES_DIR, "ofac_sample.xml"), "rb") as f:
        xml_content = f.read()

    entries = parse_ofac_xml(xml_content)
    assert len(entries) == 2

    # Individual entry
    putin = next(e for e in entries if "Putin" in e["full_name"])
    assert putin["list_type"] == "OFAC"
    assert putin["entity_type"] == "individual"
    assert putin["date_of_birth"] == "1952-10-07"
    assert putin["program"] == "RUSSIA-EO14024"
    assert "Vladimir Vladimirovich" in putin["aliases"]

    # Corporate entry
    corp = next(e for e in entries if "Cyber Threat" in e["full_name"])
    assert corp["entity_type"] == "corporate"
    assert corp["program"] == "CYBER-SANCTIONS"
    assert "CTN Global" in corp["aliases"]


def test_parse_un_xml_from_static_fixture():
    with open(os.path.join(FIXTURES_DIR, "un_sample.xml"), "rb") as f:
        xml_content = f.read()

    entries = parse_un_xml(xml_content)
    assert len(entries) == 2

    mansoor = next(e for e in entries if "Mansoor" in e["full_name"])
    assert mansoor["list_type"] == "UN"
    assert mansoor["entity_type"] == "individual"
    assert mansoor["date_of_birth"] == "1980-05-15"
    assert mansoor["nationality"] == "Syria"

    baraka = next(e for e in entries if "Baraka" in e["full_name"])
    assert baraka["list_type"] == "UN"
    assert baraka["entity_type"] == "corporate"
    assert baraka["program"] == "UN-SANCTIONS"


@pytest.mark.asyncio
async def test_ingest_ofac_with_custom_content(db_session):
    with open(os.path.join(FIXTURES_DIR, "ofac_sample.xml"), "rb") as f:
        xml_content = f.read()

    count = await sanctions_ingestor.ingest_ofac(db_session, xml_content=xml_content)
    assert count == 2

    res = await db_session.execute(select(SanctionsEntry).where(SanctionsEntry.list_type == "OFAC"))
    saved_entries = res.scalars().all()
    assert len(saved_entries) == 2


@pytest.mark.asyncio
async def test_ingest_un_with_custom_content(db_session):
    with open(os.path.join(FIXTURES_DIR, "un_sample.xml"), "rb") as f:
        xml_content = f.read()

    count = await sanctions_ingestor.ingest_un(db_session, xml_content=xml_content)
    assert count == 2

    res = await db_session.execute(select(SanctionsEntry).where(SanctionsEntry.list_type == "UN"))
    saved_entries = res.scalars().all()
    assert len(saved_entries) == 2


@pytest.mark.asyncio
async def test_seed_pep_and_mena_entries(db_session):
    pep_count = await sanctions_ingestor.seed_pep_entries(db_session)
    assert pep_count >= 3

    mena_count = await sanctions_ingestor.seed_mena_watchlists(db_session)
    assert mena_count >= 2

    res = await db_session.execute(select(SanctionsEntry).where(SanctionsEntry.list_type == "PEP"))
    assert len(res.scalars().all()) == pep_count
