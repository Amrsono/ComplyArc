FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e ".[dev]" 2>/dev/null || pip install --no-cache-dir .

# Copy application code
COPY . .

# Make render start script executable
RUN chmod +x render-start.sh 2>/dev/null || true

# Expose port (Render assigns $PORT dynamically)
EXPOSE 8000

# Use render-start.sh for auto-migration + server start
CMD ["./render-start.sh"]
