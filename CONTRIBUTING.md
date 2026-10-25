# Contributing

## Setup

| Tool | Notes |
|---|---|
| Docker + Compose v2 | основной способ |
| Node.js 22+ | hot reload фронта (опционально) |
| Python 3.13+ / [uv](https://docs.astral.sh/uv/) | бэкенд без Docker (опционально) |

Нужны рабочие **3X-UI** и **HOSTING** в `.env`, если тестируете оплату и подписки.

```bash
cp .env.example .env
make start MODE=dev
```

| URL | |
|---|---|
| http://localhost | frontend (nginx) |
| http://localhost/api | API |
| http://localhost:8000/docs | Swagger (dev) |

- **Dev** (`docker-compose.dev.yml`): API снаружи на `:8000`, reload бэкенда
- **Prod** (`docker-compose.yml`): API только `127.0.0.1:8000`, снаружи — nginx

```bash
make help
make start MODE=dev
make stop MODE=dev
make build          # prod images
```

## Frontend (hot reload)

```bash
cd frontend
npm ci
npm run dev         # http://localhost:5173 → /api → :8000
npm run build
npm run lint
```

Стек: React 19, Vite, Tailwind, shadcn/ui.

## Backend (без Docker)

```bash
docker compose up postgres -d
uv sync
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Таблицы создаются при старте (`create_all`). Миграций Alembic нет — редкие изменения схемы через `ALTER … IF NOT EXISTS` в `lifespan`.

## Layout

```
├── main.py
├── src/
│   ├── api/          # routes
│   ├── core/         # settings, deps
│   ├── models/       # Pydantic DTO
│   ├── schemas/      # SQLAlchemy
│   └── services/
├── frontend/         # React SPA
├── docker/           # Dockerfiles, nginx, worker
├── docker-compose.yml
└── docker-compose.dev.yml
```

## Env

См. [`.env.example`](.env.example). Важно сменить `APP__JWT_SECRET` и `APP__SUPERUSER_TOKEN`.

## Sequences after data import

```sql
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('registration_codes', 'id'), COALESCE((SELECT MAX(id) FROM registration_codes), 1));
SELECT setval(pg_get_serial_sequence('invoices', 'id'), COALESCE((SELECT MAX(id) FROM invoices), 1));
SELECT setval(pg_get_serial_sequence('notifications', 'id'), COALESCE((SELECT MAX(id) FROM notifications), 1));
```

## Pull requests

1. Ветка от `main`
2. Проверка: `cd frontend && npm run build && npm run lint`
3. Короткое описание **зачем**, не только что

## License

Производные работы — [GPL-3.0](LICENSE).
