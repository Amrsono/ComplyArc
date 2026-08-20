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
│   │   │   ├── core/        # Security, JWT, Config, Dependencies, Logging
│   │   │   ├── db/          # Async SQLAlchemy Engine & Migrations
│   │   │   ├── models/      # ORM Models (Clients, UBOs, Cases, Sanctions, Audit)
│   │   │   ├── schemas/     # Pydantic v2 Request/Response Schemas
│   │   │   └── services/    # Risk Engine, Screening (Fuzzy Matching), Adverse Media AI, Parsers
│   │   ├── tests/           # Pytest Async Test Suite & Static Fixtures (Zero-Network)
│   │   └── requirements.lock.txt  # Exact Pinned Dependencies
│   └── web/                 # Next.js 14 / React 18 / TypeScript Web Application
│       ├── app/             # Next.js App Router (Dashboard, Screening, Risk, Cases, Monitoring)
│       ├── components/      # UI, Layout, Toast, and Context Providers
│       ├── lib/             # API Client & i18n Localization Engine (EN, AR, FR, ES, PT)
│       └── tests/           # Vitest & React Testing Library Component Suites
├── .github/workflows/       # GitHub Actions CI Quality Gate (Lint, Build, 75% Cov Gate, Audits)
├── Dockerfile               # Root Multi-Stage Monorepo Container
├── docker-compose.yml       # Production Stack Orchestration with Automated Healthchecks
├── requirements.lock.txt    # Root Pinned Dependency Lockfile
└── package.json             # Root Workspace Configuration & Test Runners
```

---

## 🚀 Running the Automated Test Suite

Buyers and continuous integration systems can build and execute the entire end-to-end test suite across both backend and frontend with single root commands:

### Run All Tests Across Monorepo
```bash
# Runs full test suite (Vitest + Pytest) with 100% pass rate
npm test

# Run frontend tests with coverage enforcement (70%+ threshold)
npm run test:coverage

# Run backend API tests with coverage enforcement (75%+ threshold)
npm run test:api
```

### Run Backend API Tests Directly (Pytest)
```bash
cd apps/api
# In-memory async SQLite with zero live network calls
pytest tests/ -v --cov=app --cov-report=term-missing --cov-fail-under=75
```

### Run Frontend Web Tests Directly (Vitest)
```bash
cd apps/web
npm test
# Or with coverage
npm run test:coverage
```

---

## 🛠 Local Development Setup

### 1. Zero-Configuration Clean Clone
ComplyArc requires **no mandatory external API keys** for local development or testing. External integrations (`OPENAI_API_KEY`, `NEWS_API_KEY`, `SENTRY_DSN`) are optional; when absent, the system automatically falls back to deterministic NLP heuristics and offline test fixtures.

### 2. Backend API (`apps/api`)
```bash
cd apps/api
python -m venv venv
# On Windows: venv\Scripts\activate | On macOS/Linux: source venv/bin/activate
pip install -r requirements.lock.txt
uvicorn api.index:app --reload --port 8000
```
- Interactive API Swagger Docs: `http://localhost:8000/api/docs`
- Health Endpoint: `http://localhost:8000/api/health`

### 3. Frontend Web (`apps/web`)
```bash
cd apps/web
npm ci
npm run dev
```
- Web Dashboard: `http://localhost:3000`

### 4. Docker & Container Orchestration
The monorepo includes production-ready Dockerfiles with automated healthchecks:
- **Root Dockerfile**: [`Dockerfile`](Dockerfile) (Multi-stage web builder & API runner)
- **API Dockerfile**: [`apps/api/Dockerfile`](apps/api/Dockerfile) (Python 3.11-slim, uvicorn)
- **Web Dockerfile**: [`apps/web/Dockerfile`](apps/web/Dockerfile) (Node 20 multi-stage production build)

Run full stack in one command:
```bash
docker compose up -d
```

**Expected Startup Output & Health Status:**
```
[+] Running 5/5
 ✔ Network complyarc_default        Created
 ✔ Container complyarc-postgres     Healthy (port 5432)
 ✔ Container complyarc-redis        Healthy (port 6379)
 ✔ Container complyarc-api          Healthy (port 8000, /api/health -> 200 OK)
 ✔ Container complyarc-web          Started (port 3000)
```

Verify service health via curl:
```bash
curl http://localhost:8000/api/health
# {"status":"healthy","version":"1.2.0","database":"connected","environment":"production"}
```

---

## 🔒 Security & Compliance Standards

- **Zero-Knowledge API Keys**: Hashed with SHA-256 before storage.
- **Dependency & Vulnerability Scanning**: Continuous `npm audit` and `pip-audit` strictly enforced in CI.
- **Automated Dependency Updates**: Weekly automated dependency updates via `.github/dependabot.yml`.
- **Structured Logging & Telemetry**: Production JSON structured logging via `structlog` and optional Sentry telemetry.
- **Immutable Audit Trail**: Complies with FATF Recommendation 11 for record-keeping and auditability.
- **Enterprise RBAC**: Role-based access control supporting `admin`, `compliance_officer`, `analyst`, and `viewer`.
- **Explainable AI**: Every automated risk score and screening hit includes natural language evidence breakdown and score weighting rationales.
