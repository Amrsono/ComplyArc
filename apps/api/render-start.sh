#!/bin/bash
# ============================================
# ComplyArc API â€” Render Start Script
# Runs DB migrations then starts the server
# ============================================

set -e

echo "ðŸ”„ Running database migrations..."
python -m alembic upgrade head || echo "âš ï¸  Migration skipped (tables may already exist)"

echo "ðŸš€ Starting ComplyArc API on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers 2
