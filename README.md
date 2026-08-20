# ComplyArc — AI-Native AML & eKYC Operating System

[![CI Test Suite](https://github.com/ComplyArc/complyarc/actions/workflows/ci.yml/badge.svg)](https://github.com/ComplyArc/complyarc/actions/workflows/ci.yml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.0-black.svg?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.0-blue.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Pytest](https://img.shields.io/badge/Pytest-9.1.1-green.svg?style=flat&logo=pytest&logoColor=white)](https://pytest.org)
[![Vitest](https://img.shields.io/badge/Vitest-1.6.1-FCC72B.svg?style=flat&logo=vitest&logoColor=black)](https://vitest.dev)

ComplyArc is an enterprise-grade, AI-native Anti-Money Laundering (AML), Sanctions Screening, PEP Detection, Adverse Media Intelligence, and eKYC Operating System designed for modern FinTechs, banks, payment institutions, and corporate service providers.

---

## 🏛 System Architecture

The monorepo is structured as a Turbo-powered monorepo separating the high-performance async Python backend from the reactive Next.js frontend:

```
ComplyArc/
├── apps/
│   ├── api/                 # Python 3.11+ / FastAPI Backend
│   │   ├── app/
│   │   │   ├── api/         # REST API Route Controllers
│   │   │   ├── core/        # Security, JWT, Config, Dependencies
│   │   │   ├── db/          # Async SQLAlchemy Engine & Migrations
│   │   │   ├── models/      # ORM Models (Clients, UBOs, Cases, Sanctions, Audit)
│   │   │   ├── schemas/     # Pydantic v2 Request/Response Schemas
│   │   │   └── services/    # Risk Engine, Screening (Fuzzy Matching), Adverse Media AI
│   │   └── tests/           # Comprehensive Pytest Async Test Suite
│   └── web/                 # Next.js 14 / React 18 / TypeScript Web Application
│       ├── app/             # Next.js App Router (Dashboard, Screening, Risk, Cases)
│       ├── components/      # UI, Layout, Toast, and Context Providers
│       ├── lib/             # API Client & i18n Localization Engine (EN, AR, FR, ES, PT)
│       └── tests/           # Vitest & React Testing Library Suite
├── .github/workflows/       # GitHub Actions CI Workflow
├── turbo.json               # Monorepo Pipeline Orchestration
└── package.json             # Root Workspace Configuration
```

---

## 🚀 Running the Automated Test Suite

Buyers and continuous integration systems can build and execute the entire end-to-end test suite across both backend and frontend with single commands:

### Run All Tests Across Monorepo
```bash
# Runs both @complyarc/api (pytest) and @complyarc/web (vitest)
npm test
```

### Run Backend API Tests (Pytest)
```bash
# Direct via pytest in apps/api (with in-memory async SQLite)
cd apps/api
pytest tests/ -v

# Or with test coverage reporting
pytest tests/ --cov=app --cov-report=term-missing
```

### Run Frontend Web Tests (Vitest)
```bash
# Run unit & component tests in apps/web
npm run test:web
# or
cd apps/web && npm test
```

---

## 🧪 Test Suite Coverage & Verification Matrix

| Area | Component | Covered Scenarios |
| :--- | :--- | :--- |
| **Auth & Security** | `test_auth.py` | Password hashing (bcrypt), JWT creation/expiration, API Key `ctx_` prefixing & SHA-256 validation, `/auth/register`, `/auth/login`, `/auth/me` |
| **Risk Engine** | `test_risk_engine.py` | Multi-factor weighted formula: $0.40 \cdot \text{CRR} + 0.20 \cdot \text{GRR} + 0.20 \cdot \text{PRR} + 0.20 \cdot \text{IRR}$, FATF blacklists/greylists, product risk mapping, interface risks, manual overrides, version tracking |
| **Entity Resolution** | `test_screening_service.py` | Multi-algorithm fuzzy matching (Jaro-Winkler, Token Sort Ratio, Partial Ratio, Soundex/Metaphone), Arabic name transliteration normalizer, DOB exact/year-only match, nationality/ID match, batch screening |
| **Case Management** | `test_cases_and_audit.py` | Sequential case numbering (`CX-YYYY-NNNNN`), investigation state transitions, priority escalations, investigator notes, immutable compliance audit logging |
| **Client & UBO Lifecycle** | `test_clients_and_ubos.py` | Individual & Corporate KYC onboarding, UBO structure graphs & risk flagging, client search, lifecycle activation |
| **Adverse Media AI** | `test_adverse_media.py` | AI NLP sentiment extraction, crime category classification (fraud, bribery, corruption), severity categorization, offline fallback heuristics |
| **REST API Routes** | `test_api_routes.py` | End-to-end HTTP integration tests for `/api/health`, `/api/v1/screen`, `/api/v1/clients`, `/api/v1/risk`, `/api/v1/cases`, `/api/v1/dashboard/stats`, `/api/v1/dashboard/risk-analytics`, 404 diagnostics |
| **Frontend Web** | `tests/*.test.ts(x)` | Typed HTTP API client, internationalization (`i18n`) with English/Arabic RTL dynamic switching, Toast notifications, Sidebar navigation role checks |

---

## 🛠 Local Development Setup

### 1. Backend API (`apps/api`)
```bash
cd apps/api
python -m venv venv
# On Windows: venv\Scripts\activate | On macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
```
Interactive API Swagger Docs: `http://localhost:8000/api/docs`

### 2. Frontend Web (`apps/web`)
```bash
cd apps/web
npm install
npm run dev
```
Web Dashboard: `http://localhost:3000`

---

## 🔒 Security & Compliance Standards

- **Zero-Knowledge API Keys**: Hashed with SHA-256 before storage.
- **Immutable Audit Trail**: Complies with FATF Recommendation 11 for record-keeping and auditability.
- **Enterprise RBAC**: Role-based access control supporting `admin`, `compliance_officer`, `analyst`, and `viewer`.
- **Explainable AI**: Every automated risk score and screening hit includes natural language evidence breakdown and score weighting rationales.
