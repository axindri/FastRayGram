# Участие в разработке

Спасибо за интерес к проекту! Ниже — как поднять **Fast Ray Gram** локально и куда смотреть в коде.

## Что понадобится

| Инструмент | Версия | Зачем |
|---|---|---|
| [Docker](https://docs.docker.com/get-docker/) + Compose | актуальные | основной способ запуска |
| [Node.js](https://nodejs.org/) | 22+ | hot reload фронтенда (опционально) |
| [Python](https://www.python.org/) | 3.13+ | запуск бэкенда без Docker (опционально) |
| [uv](https://docs.astral.sh/uv/) | актуальный | зависимости Python (опционально) |

Для полноценной работы также нужны внешние сервисы (настраиваются в `.env`):

- панель **3X-UI** с API-ключом;
- **TimeWeb** — токен и `payer_id` (если тестируете оплату).

## Быстрый старт (Docker, dev)

```bash
git clone <repository-url>
cd fast-ray-gram
cp .env.example .env
# отредактируйте .env — минимум JWT, XUI, TimeWeb

docker compose -f docker-compose.dev.yml up --build
```

После старта:

| URL | Описание |
|---|---|
| http://localhost:8000 | API + собранный React |
| http://localhost:8081 | SQLite Web (просмотр БД) |
| http://localhost:8000/docs | Swagger |

Бэкенд в dev-режиме перезагружается при изменении файлов в `src/` и `main.py`.

## Фронтенд с hot reload

В отдельном терминале:

```bash
cd frontend
npm ci
npm run dev
```

Vite: http://localhost:5173 — проксирует запросы к API на `:8000` (если настроен в `vite.config`).

Сборка продакшен-бандла:

```bash
cd frontend && npm run build
```

Артефакт попадает в `src/static/dist/` и отдаётся бэкендом.

## Бэкенд без Docker (опционально)

```bash
cp .env.example .env
uv sync
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

База по умолчанию: `sqlite+aiosqlite:///./database/data.db` (создайте каталог `database/`).

## Структура репозитория

```
fast-ray-gram/
├── main.py              # точка входа FastAPI
├── src/
│   ├── api/             # HTTP-роуты
│   ├── core/            # настройки, enum, deps
│   ├── models/          # Pydantic DTO
│   ├── schemas/         # SQLAlchemy ORM
│   └── services/        # бизнес-логика
├── frontend/            # React + Vite + Ant Design
├── docker/              # Dockerfile, воркер инвойсов
└── docs/                # документация
```

Подробнее о фронтенде: [docs/frontend.md](docs/frontend.md).

## Переменные окружения

Шаблон — [.env.example](.env.example). Ключевые:

- `APP__JWT_SECRET`, `APP__SUPERUSER_TOKEN` — обязательно сменить;
- `XUI__URL`, `XUI__SUB_URL`, `XUI__API_KEY` — панель 3X-UI;
- `TIMEWEB__TOKEN`, `TIMEWEB__PAYER_ID` — платежи.

## Как отправить изменения

1. Создайте ветку от `main`.
2. Внесите правки, проверьте сборку:
   ```bash
   cd frontend && npm run build
   uv run uvicorn main:app --host 127.0.0.1 --port 8000  # smoke-test API
   ```
3. Откройте pull request с кратким описанием «зачем», не только «что».

Проект распространяется под **GPL-3.0** — производные работы должны оставаться открытыми на тех же условиях. См. [LICENSE](LICENSE).

## Вопросы

Если что-то в инструкции устарело — откройте issue или поправьте этот файл в том же PR.
