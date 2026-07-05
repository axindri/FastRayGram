# Участие в разработке

Спасибо за интерес к проекту! Ниже — как поднять **Fast Ray Gram** локально и куда смотреть в коде.

## Что понадобится

| Инструмент | Версия | Зачем |
|---|---|---|
| [Docker](https://docs.docker.com/get-docker/) + Compose v2 | актуальные | основной способ запуска |
| [Node.js](https://nodejs.org/) | 22+ | hot reload фронтенда (опционально) |
| [Python](https://www.python.org/) | 3.13+ | запуск бэкенда без Docker (опционально) |
| [uv](https://docs.astral.sh/uv/) | актуальный | зависимости Python (опционально) |

Для полноценной работы также нужны внешние сервисы (настраиваются в `.env`):

- панель **3X-UI** с API-ключом;
- **TimeWeb** — токен и `payer_id` (если тестируете оплату).

## Быстрый старт (Docker, dev)

```bash
git clone <repository-url>
cd FastRayGram
cp .env.example .env
# отредактируйте .env — минимум JWT, XUI, TimeWeb, пароль БД

make start MODE=dev
# или: docker compose -f docker-compose.dev.yml up -d --build
```

После старта:

| URL | Описание |
|---|---|
| http://localhost | Фронтенд (nginx) |
| http://localhost/api | API через nginx |
| http://localhost:8000/docs | Swagger (напрямую к API в dev) |
| localhost:5432 | PostgreSQL (`DB__PORT`) |

**Dev** (`docker-compose.dev.yml`): API доступен снаружи на `:8000`, код бэкенда в `src/` и `main.py` смонтирован в контейнер (uvicorn с `--reload`).

**Prod** (`docker-compose.yml`): API с хоста только на `127.0.0.1:8000`; снаружи — только через nginx на порту `FRONTEND_PORT` (по умолчанию `80`).

`invoice-worker` ходит в API напрямую (`http://app:8000`), минуя nginx и rate limit.

### Rate limit (nginx)

На `/api/` действуют два лимита с одного IP (срабатывает более строгий):

- **5 req/s**, burst 15
- **60 req/min**, burst 10

При превышении — `429`; браузер перенаправляется на `/too-many-requests`.

### Makefile

```bash
make help              # список команд
make start MODE=dev    # dev-стек в фоне
make stop MODE=dev     # остановить dev
make build             # пересобрать prod-образы
make update            # git pull + build
```

Без `MODE=dev` используется `docker-compose.yml` (prod).

## Фронтенд с hot reload

В отдельном терминале (нужен запущенный API на `:8000`):

```bash
cd frontend
npm ci
npm run dev
```

Vite: http://localhost:5173 — проксирует `/api` на `http://localhost:8000` (см. `frontend/vite.config.ts`).

Сборка продакшен-бандла:

```bash
cd frontend && npm run build
```

Артефакт попадает в `src/static/dist/` и в prod собирается внутри образа `frontend` (nginx).

Линтер фронтенда:

```bash
cd frontend && npm run lint
```

Стек UI: **React 19**, **Vite**, **Tailwind CSS**, **shadcn/ui** (Radix). Подробнее: [docs/frontend.md](docs/frontend.md).

## Бэкенд без Docker (опционально)

```bash
cp .env.example .env
# DB__HOST=localhost  — если Postgres уже запущен локально или в Docker

docker compose up postgres -d   # только БД
# или: make start MODE=dev и остановить app/frontend

uv sync
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Схема БД создаётся при старте (`create_all` в `main.py`). Полноценных миграций (Alembic) нет — для существующей БД при добавлении колонок используются точечные `ALTER TABLE … IF NOT EXISTS` в `lifespan`.

## Структура репозитория

```
FastRayGram/
├── main.py                 # точка входа FastAPI
├── src/
│   ├── api/                # HTTP-роуты (/api/...)
│   ├── core/               # настройки, enum, deps, handlers
│   ├── models/             # Pydantic DTO (запросы/ответы)
│   ├── schemas/            # SQLAlchemy ORM
│   ├── services/           # бизнес-логика
│   └── static/dist/        # собранный фронтенд (генерируется)
├── frontend/               # React SPA (исходники)
├── docker/
│   ├── Dockerfile          # prod API
│   ├── Dockerfile.dev      # dev API
│   ├── Dockerfile.frontend # nginx + статика
│   ├── nginx/              # конфиг nginx
│   └── invoice-worker.sh
├── database/postgres/      # данные PostgreSQL (volume)
├── docker-compose.yml      # prod
├── docker-compose.dev.yml  # dev
└── docs/                   # документация
```

## Переменные окружения

Шаблон — [.env.example](.env.example). Ключевые:

| Переменная | Описание |
|---|---|
| `APP__JWT_SECRET` | Секрет подписи JWT (обязательно сменить) |
| `APP__SUPERUSER_TOKEN` | Токен суперпользователя и воркера инвойсов |
| `APP__MONITORING_SERVICE_URL` | URL внешнего мониторинга |
| `XUI__URL`, `XUI__SUB_URL`, `XUI__API_KEY` | Панель 3X-UI |
| `TIMEWEB__TOKEN`, `TIMEWEB__PAYER_ID` | Платежи TimeWeb |
| `DB__HOST`, `DB__PORT`, `DB__USER`, `DB__PASSWORD`, `DB__DB` | PostgreSQL |
| `APP_PORT` | Порт API на хосте (по умолчанию `8000`) |
| `FRONTEND_PORT` | Порт nginx (по умолчанию `80`) |
| `CHECK_INTERVAL_SEC` | Интервал проверки оплат воркером |

## База данных

### После импорта / миграции данных

Если `id` в таблицах уже заняты, а sequence откатился к `1`, выровняйте счётчики:

```bash
docker compose exec postgres psql -U fastraygram -d fastraygram
```

```sql
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('registration_codes', 'id'), COALESCE((SELECT MAX(id) FROM registration_codes), 1));
SELECT setval(pg_get_serial_sequence('invoices', 'id'), COALESCE((SELECT MAX(id) FROM invoices), 1));
```

Логин и имя БД — из `.env` (`DB__USER`, `DB__DB`).

## Pull request

1. Создайте ветку от `main`.
2. Внесите правки, проверьте сборку:
   ```bash
   cd frontend && npm run build && npm run lint
   uv run python -c "from main import app"
   ```
3. Откройте pull request с кратким описанием «зачем», не только «что».

## Лицензия

Проект распространяется под **GPL-3.0** — производные работы должны оставаться открытыми на тех же условиях. См. [LICENSE](LICENSE).

## Вопросы

Если что-то в инструкции устарело — откройте issue или поправьте этот файл в том же PR.
