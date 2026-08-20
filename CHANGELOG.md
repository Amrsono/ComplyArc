# Changelog

All notable changes to the ComplyArc AI-Native Compliance Operating System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-08-20

### Added
- **Sanctions Parsers & Ingestor Module**: Modularized OFAC SDN and UN Consolidated XML parsing into `ofac_parser.py` and `un_parser.py`.
- **Static XML & JSON Test Fixtures**: Added zero-network static fixtures (`ofac_sample.xml`, `un_sample.xml`, `adverse_media_sample.json`) for fully self-contained offline testing.
- **Multilingual Name Normalization Service**: Extracted Arabic transliteration, Soundex/Metaphone phonetic stripping, and stem standardization to `name_normalization.py` with dedicated unit test suite.
- **Frontend Test Suite Expansion & 60% Coverage Gate**: Added component test suites for `ApiKeysSettings`, `LoginPage`, `DashboardPage`, `AdverseMediaPage`, and `MonitoringPage` with enforced 60% Vitest coverage gates across lines and functions.
- **Error Tracking & Sentry Integration**: Added optional Sentry telemetry hook behind `SENTRY_DSN` with environment-aware sample rates.
- **Python Dependency Lockfile**: Added `requirements-lock.txt` for reproducible zero-config installs.

### Changed
- Refactored `sanctions_ingestor.py` into a lightweight orchestrator (<140 LOC) emitting structured log events with key-value pairs.
- Upgraded adverse media NLP heuristic classification to detect money laundering, indictment, and fraud keywords in absence of external LLM keys.

---

## [1.1.0] - 2026-08-20

### Added
- **Automated Dependency Management**: Configured `.github/dependabot.yml` for automated weekly updates across root, frontend, and backend packages.
- **Security Vulnerability Audits in CI**: Integrated `pip-audit` and `npm audit --audit-level=critical` into GitHub Actions CI workflow.
- **Structured JSON Logging**: Implemented `structlog` pipeline with JSON formatting in production and colored console logs in local development.
- **Serverless Resilience**: Added self-healing table setup and default admin user auto-recovery for cold Lambda executions on Vercel.

### Changed
- Refactored frontend TypeScript domain types across Client, UBO, ScreeningResult, RiskBreakdown, and Alert models.

---

## [1.0.0] - 2026-08-19

### Added
- **Core AI-Native AML & eKYC Platform**:
  - Entity screening with Jaro-Winkler, Token Sort, and phonetic fuzzy matching.
  - Multi-tier dynamic risk scoring engine.
  - Compliance case workflow management and Kanban board.
  - Continuous client monitoring and automated alert generation.
  - Adverse media scanning and NLP sentiment classification.
  - Next.js 14 glassmorphic analyst interface and FastAPI async backend.
