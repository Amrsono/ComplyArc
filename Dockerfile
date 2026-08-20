# ComplyArc — Multi-Stage Monorepo Container
FROM node:20-alpine AS web-builder
WORKDIR /app/web
COPY apps/web/package*.json ./
RUN npm ci
COPY apps/web/ ./
RUN npm run build

FROM python:3.11-slim AS api-runner
WORKDIR /app

# Install system build dependencies & curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY apps/api/requirements.txt ./apps/api/
RUN pip install --no-cache-dir -r apps/api/requirements.txt

COPY apps/api/ ./apps/api/

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=10s \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["python", "-m", "uvicorn", "apps.api.api.index:app", "--host", "0.0.0.0", "--port", "8000"]
