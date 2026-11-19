# Build for linux/arm64 and linux/amd64 (STB HG680P Armbian compatible)
FROM python:3.11-slim

# Prevent Python from writing .pyc and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application codebase
COPY app/ ./app/
COPY scripts/ ./scripts/

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Create non-root user for security
RUN addgroup --system appgroup && adduser --system --group appuser \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Entrypoint: run database seed then start uvicorn
CMD ["sh", "-c", "python scripts/seed.py && python scripts/export_openapi.py && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1"]
