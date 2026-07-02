# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json frontend/.npmrc ./
RUN --mount=type=cache,target=/root/.npm,id=fast-ray-gram-npm \
    npm ci --prefer-offline --no-audit --no-fund

COPY frontend/ ./
RUN npm run build


FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .
COPY --from=frontend /app/src/static/dist /app/src/static/dist
RUN uv sync --frozen --no-dev

RUN mkdir -p /app/database

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
