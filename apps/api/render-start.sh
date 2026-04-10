#!/bin/bash
# ============================================
# Cortex AML API — Render Start Script
# Runs DB migrations then starts the server
# ============================================

set -e

echo "🔄 Running database migrations..."
python -m alembic upgrade head || echo "⚠️  Migration skipped (tables may already exist)"

echo "🚀 Starting Cortex AML API on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers 2
