<p align="center">
  <img src="frontend/public/frg_light.png" alt="Fast Ray Gram" width="160" />
</p>

<h1 align="center">Fast Ray Gram</h1>

<p align="center">
  Личный кабинет и админка для VPN-подписки на базе <strong>3X-UI</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-blue.svg" alt="License: GPL-3.0" /></a>
  <img src="https://img.shields.io/badge/python-3.13+-blue.svg" alt="Python" />
  <img src="https://img.shields.io/badge/frontend-React_19-61dafb.svg" alt="React" />
</p>

---

## О проекте

**Fast Ray Gram** — self-hosted веб-приложение для небольших VPN-сервисов:

- **Личный кабинет** — подписка, ссылка для VPN-клиента, оплата продления, вход по ссылке без пароля.
- **Регистрация по коду** — админ выдаёт ссылку, пользователь сам создаёт аккаунт.
- **Админка** — пользователи, XUI-клиенты, счета, коды регистрации, мониторинг сервисов.
- **Платежи** — выставление счетов в TimeWeb, фоновая проверка оплат, продление подписки в XUI.

Стек: **FastAPI** · **PostgreSQL** · **React** · **Docker**.

## Скриншоты

Интерфейс в тёмной теме. Все изображения лежат в [`docs/screenshots/`](docs/screenshots/).

| Профиль | Пользователи |
|:---:|:---:|
| [![Профиль пользователя](docs/screenshots/profile.png)](docs/screenshots/profile.png) | [![Управление пользователями](docs/screenshots/users.png)](docs/screenshots/users.png) |
| Личный кабинет: подписка, ссылка для входа, счета | Админка: создание пользователей и XUI-клиентов |

| Регистрация | Платежи |
|:---:|:---:|
| [![Регистрация по коду](docs/screenshots/register.png)](docs/screenshots/register.png) | [![Платежи и счета](docs/screenshots/payments.png)](docs/screenshots/payments.png) |
| Самостоятельная регистрация по ссылке от админа | Проверка оплат, список инвойсов, отмена счетов |


## Запуск на сервере

### Пререквизиты

На сервере (VPS / bare metal):

1. **Docker** и **Docker Compose** v2
2. Рабочая панель **3X-UI** (API URL, sub URL, API key)
3. Аккаунт **TimeWeb** с API-токеном и `payer_id` (для приёма платежей)
4. Открытый порт **80/443** (или проброс на `APP_PORT`)

Опционально: reverse proxy (Caddy / Nginx) и TLS-сертификат перед контейнером.

### Деплой

```bash
git clone <repository-url>
cd fast-ray-gram
cp .env.example .env
```

Заполните `.env` — обязательно смените секреты и укажите XUI / TimeWeb.

```bash
docker compose up -d --build
```

Приложение: `http://<ваш-сервер>/` (фронтенд, порт `FRONTEND_PORT`, по умолчанию `80`). API с rate limit — только через nginx (`/api/...`). Прямой доступ к FastAPI на `:8000` привязан к `127.0.0.1` (для отладки с сервера).

Стек контейнеров: **nginx** (фронтенд + прокси `/api`) → **FastAPI** → **PostgreSQL**. Nginx ограничивает API: **5 req/s** (burst 15) и **60 req/min** (burst 10) с одного IP (`429` при превышении; браузер перенаправляется на `/too-many-requests`).

Вместе с приложением поднимаются **PostgreSQL** и **invoice-worker** (проверка оплат, `CHECK_INTERVAL_SEC`, по умолчанию 30 с).

PostgreSQL доступен снаружи на порту `DB__PORT` (по умолчанию `5432`). Конфигурация рассчитана на VPS с 1 GB RAM / 1 vCPU — см. `docker/postgres/postgresql.conf`.

### Переменные окружения

| Переменная | Описание |
|---|---|
| `APP__JWT_SECRET` | Секрет подписи JWT |
| `APP__SUPERUSER_TOKEN` | Токен суперпользователя и воркера инвойсов |
| `APP__MONITORING_SERVICE_URL` | URL внешнего мониторинга (Uptime Kuma и т.п.) |
| `XUI__URL` / `XUI__SUB_URL` / `XUI__API_KEY` | Панель 3X-UI |
| `TIMEWEB__TOKEN` / `TIMEWEB__PAYER_ID` | Платежи TimeWeb |
| `DB__HOST` / `DB__PORT` / `DB__USER` / `DB__PASSWORD` / `DB__DB` | Подключение к PostgreSQL (URL собирается автоматически) |
| `APP_PORT` | Порт API на хосте (по умолчанию `8000`) |
| `FRONTEND_PORT` | Порт nginx на хосте (по умолчанию `80`) |
| `CHECK_INTERVAL_SEC` | Интервал проверки оплат |

Полный список — в [`.env.example`](.env.example).

## Документация

- [Участие в разработке и локальный запуск](CONTRIBUTING.md)

## Лицензия

Проект распространяется под лицензией **[GNU General Public License v3.0](LICENSE)**.

Вы можете свободно использовать, изменять и распространять код при условии сохранения той же лицензии для производных работ.
