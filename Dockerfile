# Stage 1: Build Next.js static export
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend serving static files
FROM python:3.12-slim
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv export --no-hashes --no-emit-project -o /tmp/requirements.txt && \
    uv pip install --system -r /tmp/requirements.txt

COPY backend/prelegal_backend/ ./prelegal_backend/
COPY --from=frontend-builder /app/frontend/out /app/static

RUN mkdir -p /app/data

EXPOSE 8000
ENV STATIC_DIR=/app/static
ENV DB_PATH=/app/data/prelegal.db
CMD ["uvicorn", "prelegal_backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
