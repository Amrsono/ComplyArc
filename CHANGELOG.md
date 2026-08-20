# Changelog

All notable changes to **ComplyArc** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-20

### Added
- **Core AML & eKYC Operating System**:
  - FastAPI asynchronous backend supporting PostgreSQL with `asyncpg` and SQLite with `aiosqlite`.
  - Next.js 14 reactive frontend with multi-language i18n support (English, Arabic RTL, French, Spanish, Portuguese).
- **Sanctions Screening & Entity Resolution Engine**:
  - Real-time sanctions screening across OFAC, UN Security Council, EU Consolidated, and PEP datasets.
  - Multi-algorithm phonetic and token similarity scoring (Jaro-Winkler, Token Sort, Partial Ratio, Soundex/Metaphone).
  - Arabic name transliteration and prefix normalizer (Al/El, Mohamed variants, Abd root matching).
- **Multi-Factor Risk Scoring Engine**:
  - Weighted risk calculation formula: $0.40 \cdot \text{CRR} + 0.20 \cdot \text{GRR} + 0.20 \cdot \text{PRR} + 0.20 \cdot \text{IRR}$.
  - Automated FATF blacklist (KP, IR, MM) and greylist country weighting.
  - Comprehensive client PEP exposure and UBO ownership percentage aggregation.
- **Adverse Media AI Module**:
  - Natural Language Processing (NLP) pipeline for adverse media sentiment extraction.
  - Heuristic offline fallback classification for financial crime, fraud, bribery, and corruption.
- **Case Management & Audit Trail**:
  - Full investigation lifecycle (`open` $\rightarrow$ `under_review` $\rightarrow$ `escalated` $\rightarrow$ `closed`).
  - Sequential regulatory case numbering (`CX-YYYY-NNNNN`).
  - Immutable compliance audit logging complying with FATF Recommendation 11.
- **Comprehensive Automated Test Suite**:
  - 35 backend tests in `apps/api/tests/` using Pytest and AsyncClient fixtures against in-memory SQLite.
  - 10 frontend tests in `apps/web/tests/` using Vitest and React Testing Library.
  - Unified monorepo `npm test` pipeline.
- **CI/CD & Containerization**:
  - GitHub Actions CI workflow covering linting, type-checking, backend Pytest, and frontend Vitest suites.
  - Production Dockerfiles for backend API and frontend web with Docker Compose orchestration.
