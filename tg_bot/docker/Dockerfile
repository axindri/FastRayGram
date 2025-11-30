FROM python:3.12.9-slim-bookworm

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV PYTHONUNBUFFERED=1
ENV UV_LINK_MODE=copy

WORKDIR /opt/app

COPY . .

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-dev --locked --no-install-project --compile-bytecode

CMD ["uv", "run", "--no-dev", "python", "main.py"]

