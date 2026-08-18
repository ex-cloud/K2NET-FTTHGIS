# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --prefix=/install -r requirements.txt


# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Non-root user untuk keamanan
RUN groupadd -r aigateway && useradd -r -g aigateway -s /bin/false aigateway

# Copy installed packages dari builder
COPY --from=builder /install /usr/local

# Copy application code
COPY app/ ./app/

# Ownership
RUN chown -R aigateway:aigateway /app

USER aigateway

# Health check untuk Docker & Traefik
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5012}/health || exit 1

EXPOSE ${PORT:-5012}

CMD ["python", "-m", "uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "5012", \
     "--workers", "2", \
     "--log-level", "info"]
