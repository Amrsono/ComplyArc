# Contributing to ComplyArc

Thank you for contributing to ComplyArc! We welcome pull requests from all contributors. Please review this guide before submitting changes.

---

## 🛠 Local Development Setup

### Prerequisites
- Node.js >= 20.0.0
- Python >= 3.11.0
- Docker & Docker Compose (optional for full container stack)

### 1. Fresh Clone Setup
```bash
git clone https://github.com/Amrsono/ComplyArc.git
cd ComplyArc

# Install frontend dependencies
npm install

# Setup backend Python environment
cd apps/api
python -m venv venv
# On Windows: venv\Scripts\activate | On macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

---

## 🧪 Testing Guidelines

Every new feature or bug fix must be paired with automated tests proving its correctness. Pull requests with missing tests will not be merged.

### Run All Tests
```bash
npm test
```

### Run API Tests
```bash
npm run test:api
# Or directly inside apps/api
pytest tests/ -v --cov=app
```

### Run Frontend Tests
```bash
npm run test:web
```

---

## 🔍 Linting & Type Checking

Before opening a pull request, ensure all linters and type checkers pass:

```bash
# Run linting
npm run lint

# Run frontend build / type check
npm run build:web
```

---

## 🚀 Pull Request Process

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit in small, focused increments with descriptive commit messages following [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(...)`: New features
   - `fix(...)`: Bug fixes
   - `test(...)`: Adding or updating tests
   - `docs(...)`: Documentation updates
3. Ensure the GitHub Actions CI pipeline passes all checks (Lint, Typecheck, Pytest, Vitest).
4. Open a Pull Request against `main`.
