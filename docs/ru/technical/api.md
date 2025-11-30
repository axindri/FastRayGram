# API Документация

## Обзор API

### Базовый URL

Все API endpoints доступны по базовому URL: `https://your-domain.com/api`

### Версионирование

API использует версионирование через префикс `/v1` в URL:
- `/api/app/v1/` - публичные endpoints
- `/api/auth/v1/` - аутентификация
- `/api/backend/v1/` - пользовательские endpoints
- `/api/admin/v1/` - административные endpoints

### Формат запросов и ответов

- **Формат запросов:** JSON (Content-Type: `application/json`)
- **Формат ответов:** JSON
- **Кодировка:** UTF-8

### Коды состояния HTTP

- `200 OK` - успешный запрос
- `201 Created` - ресурс создан
- `400 Bad Request` - неверный запрос
- `401 Unauthorized` - требуется аутентификация
- `403 Forbidden` - недостаточно прав
- `404 Not Found` - ресурс не найден
- `409 Conflict` - конфликт (уникальное ограничение, внешний ключ)
- `422 Unprocessable Entity` - ошибка валидации
- `429 Too Many Requests` - превышен лимит запросов
- `500 Internal Server Error` - внутренняя ошибка сервера
- `501 Not Implemented` - функция не реализована

### Обработка ошибок

Ошибки возвращаются в формате JSON с кодом ошибки:

```json
{
  "detail": "error_code: Описание ошибки или ERRORTAG:[timestamp]"
}
```

**Типы ошибок (ErrorCode):**

- `unexpected_error` - неожиданная ошибка (500)
- `object_not_found` - объект не найден (404)
- `object_foreign_key_error` - нарушение внешнего ключа (409)
- `unique_violation_error` - нарушение уникальности (409)
- `validation_error` - ошибка валидации (422)
- `registration_disabled_error` - регистрация отключена (403)
- `permission_error` - недостаточно прав (403)
- `rate_limit_error` - превышен лимит запросов (429)
- `not_authorized_error` - не авторизован (401)
- `not_implemented_error` - не реализовано (501)
- `xui_error` - ошибка интеграции с XUI (400)
- `user_not_verified_error` - пользователь не верифицирован (403)

## Публичные endpoints

### `/api/app/v1/`

#### Health Check

**GET** `/api/app/v1/health`

Проверка статуса приложения и доступности сервисов.

**Ответ:**
```json
{
  "statuses": {
    "total": "ok",
    "api": "ok",
    "db": "ok",
    "redis": "ok",
    "rate_limiter_redis": "ok",
    "xui": "ok",
    "allowed_statuses": ["ok", "error", "warning"]
  },
  "now_timestamp": "2024-01-01T00:00:00",
  "uptime": "1d 2h 30m"
}
```

#### Настройки приложения

**GET** `/api/app/v1/settings`

Получение публичных настроек приложения. Требует аутентификации (роль USER).

**Заголовки:**
- `Authorization: Bearer {access_token}`

**Ответ:**
```json
{
  "basic": {
    "disable_registration": false
  },
  "service": {
    "max_limit_ip": 10,
    "max_total_gb": 1000
  }
}
```

**PATCH** `/api/app/v1/settings`

Обновление настроек приложения. Требует роли SUPERUSER.

**Заголовки:**
- `Authorization: Bearer {access_token}`

**Тело запроса:**
```json
{
  "basic": {
    "disable_registration": false
  },
  "service": {
    "max_limit_ip": 10,
    "max_total_gb": 1000
  }
}
```

## Аутентификация и авторизация

### `/api/auth/v1/`

#### Регистрация

**POST** `/api/auth/v1/register`

Регистрация нового пользователя.

**Тело запроса:**
```json
{
  "user": {
    "login": "username",
    "password": "secure_password"
  },
  "profile": {
    "email": "user@example.com",
    "first_name": "Имя",
    "last_name": "Фамилия"
  }
}
```

**Валидация login:**
- Минимум 6 символов, максимум 20
- Должен начинаться с буквы
- Может содержать буквы, цифры и подчеркивания

**Ответ:**
```json
{
  "msg": "Success"
}
```

**Ошибки:**
- `registration_disabled_error` - регистрация отключена
- `unique_violation_error` - пользователь с таким login уже существует
- `validation_error` - ошибка валидации данных

#### Вход в систему

**POST** `/api/auth/v1/login`

Вход в систему и получение JWT токенов.

**Тело запроса:**
```json
{
  "login": "username",
  "password": "secure_password"
}
```

**Ответ:**
```json
{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token"
}
```

**Ошибки:**
- `not_authorized_error` - неверный login или password
- `user_not_verified_error` - пользователь не верифицирован

#### Авторизация через социальные сети

**POST** `/api/auth/v1/login/social/{name}`

Авторизация в приложении через социальные сети. На текущий момент доступна авторизация через аккаунт Telegram.

**Параметры пути:**
- `name` - имя социальной сети (`telegram`)

**Тело запроса (для Telegram):**
```json
{
  "id": 123456789,
  "first_name": "Имя",
  "last_name": "Фамилия",
  "username": "username",
  "photo_url": "https://...",
  "auth_date": 1234567890,
  "hash": "hash_string"
}
```

**Ответ:** Пара JWT токенов

**Ошибки:**
- `not_implemented_error` - социальная сеть не поддерживается
- `validation_error` - неверные данные Telegram

#### Обновление токенов

**POST** `/api/auth/v1/refresh`

Обновление access token с помощью refresh token.

**Query параметры:**
- `token` - refresh token

**Пример:**
```
POST /api/auth/v1/refresh?token={refresh_token}
```

**Ответ:** Новая пара токенов

**Ошибки:**
- `not_authorized_error` - неверный или истекший refresh token

#### Выход из системы

**POST** `/api/auth/v1/logout`

Выход из системы и деактивация текущей сессии.

**Заголовки:**
- `Authorization: Bearer {access_token}`

**Ответ:**
```json
{
  "msg": "Success"
}
```

#### Восстановление пароля

**POST** `/api/auth/v1/forgot-password`

Запрос на восстановление пароля.

**Query параметры:**
- `login` - login пользователя

**Ответ:**
```json
{
  "msg": "Success"
}
```

#### Смена пароля

**POST** `/api/auth/v1/change-password`

Смена пароля текущего пользователя. После смены все сессии будут завершены.

**Заголовки:**
- `Authorization: Bearer {access_token}`

**Тело запроса:**
```json
{
  "old_password": "old_password",
  "new_password": "new_secure_password"
}
```

**Ответ:**
```json
{
  "msg": "Success"
}
```

**Ошибки:**
- `not_authorized_error` - неверный старый пароль
- `validation_error` - новый пароль не соответствует требованиям

#### Информация о текущем пользователе

**GET** `/api/auth/v1/me`

Получение информации о текущем авторизованном пользователе.

**Заголовки:**
- `Authorization: Bearer {access_token}`

**Ответ:**
```json
{
  "id": "uuid",
  "role": "USER"
}
```

#### Запрос верификации

**POST** `/api/auth/v1/request-verification`

Запрос на верификацию аккаунта.

**Заголовки:**
- `Authorization: Bearer {access_token}`

**Ответ:**
```json
{
  "msg": "Success"
}
```

#### Проверка прав доступа

**POST** `/api/auth/v1/check-permission`

Проверка наличия определенной роли у пользователя.

**Заголовки:**
- `Authorization: Bearer {access_token}`

**Query параметры:**
- `role` - роль для проверки (`USER`, `ADMIN`, `SUPERUSER`)

**Ответ:**
```json
{
  "msg": "Granted"
}
```

**Ошибки:**
- `permission_error` - недостаточно прав

#### Управление аккаунтом

**GET** `/api/auth/v1/account/profile`

Получение полного профиля аккаунта (пользователь, профиль, социальные сети).

**Заголовки:**
- `Authorization: Bearer {access_token}`

**Ответ:**
```json
{
  "user": {
    "id": "uuid",
    "login": "username",
    "status": "active"
  },
  "profile": {
    "email": "user@example.com",
    "first_name": "Имя",
    "last_name": "Фамилия"
  },
  "socials": []
}
```

**PATCH** `/api/auth/v1/account/profile`

Обновление профиля аккаунта.

**Заголовки:**
- `Authorization: Bearer {access_token}`

**Тело запроса:**
```json
{
  "email": "new_email@example.com",
  "first_name": "Новое имя",
  "last_name": "Новая фамилия"
}
```

**GET** `/api/auth/v1/account/notifications`

Получение списка уведомлений пользователя (для всех ролей, с пагинацией).

**Заголовки:**
- `Authorization: Bearer {access_token}`

**Query параметры:**
- `page` - номер страницы (по умолчанию: 1)
- `limit` - количество элементов (по умолчанию: 10)

**Ответ:** PagedResponse с уведомлениями

#### Управление сессиями

**GET** `/api/auth/v1/sessions/`

Получение списка активных сессий пользователя (с пагинацией).

**Заголовки:**
- `Authorization: Bearer {access_token}`

**Query параметры:**
- `page` - номер страницы
- `limit` - количество элементов

**Ответ:** PagedResponse с сессиями

**DELETE** `/api/auth/v1/sessions/terminate/{session_id}`

Завершение конкретной сессии.

**Заголовки:**
- `Authorization: Bearer {access_token}`

**Параметры пути:**
- `session_id` - UUID сессии

**Ответ:**
```json
{
  "msg": "Success"
}
```

**DELETE** `/api/auth/v1/sessions/terminate-all`

Завершение всех сессий пользователя.

**Заголовки:**
- `Authorization: Bearer {access_token}`

**Query параметры:**
- `exclude_current` - исключить текущую сессию (по умолчанию: `true`)

**Ответ:**
```json
{
  "msg": "Successfully terminated all active sessions, except current"
}
```

## Endpoints для пользователей

### `/api/backend/v1/`

Для взаимодействия с всеми Endpoints, аккаунт пользователя с ролью USER должен соответствовать критериям:
* аккаунт аутентифицирован;
* аккаунт верифицирован пользователем с ролями ADMIN или SUPERUSER

**Заголовки:**
- `Authorization: Bearer {access_token}`

#### Конфигурации

**GET** `/api/backend/v1/client/configs`

Получение списка конфигураций пользователя (с пагинацией).

**Query параметры:**
- `page` - номер страницы
- `limit` - количество элементов

**Ответ:** PagedResponse с ConfigSimpleResponse

**GET** `/api/backend/v1/client/configs/by-type/{type}`

Получение или создание конфигурации определенного типа.

**Параметры пути:**
- `type` - тип конфигурации (`VLESS`, `TROJAN`)

**Ответ:** ConfigResponse

**POST** `/api/backend/v1/client/configs/{config_id}/renew`

Создание запроса на продление конфигурации.

**Параметры пути:**
- `config_id` - UUID конфигурации

**Ответ:**
```json
{
  "msg": "Success"
}
```

**POST** `/api/backend/v1/client/configs/{config_id}/update-limits`

Создание запроса на обновление лимитов конфигурации.

**Параметры пути:**
- `config_id` - UUID конфигурации

**Тело запроса:**
```json
{
  "total_gb": 200,
  "limit_ip": 5
}
```

**Ответ:**
```json
{
  "msg": "Success"
}
```

#### Новости

**GET** `/api/backend/v1/news`

Получение списка новостей (с пагинацией).

**Query параметры:**
- `page` - номер страницы
- `limit` - количество элементов

**Ответ:** PagedResponse с NewsResponse

## Административные endpoints

### `/api/admin/v1/`

Все endpoints требуют аутентификации и роли ADMIN или SUPERUSER (в зависимости от endpoint). При этом все аутентифицированные пользователи с ролями ADMIN и SUPERUSER не требуют верификации.

**Заголовки:**
- `Authorization: Bearer {access_token}`

#### Управление пользователями

**GET** `/api/admin/v1/entities/users`

Список пользователей (CRUD, с пагинацией и фильтрацией).

**Query параметры:**
- `page` - номер страницы
- `limit` - количество элементов
- `login` - фильтр по login
- `status` - фильтр по статусу

**Ответ:** PagedResponse с UserResponse

**GET** `/api/admin/v1/entities/users/{user_id}`

Информация о конкретном пользователе.

**GET** `/api/admin/v1/users/{user_id}/profile`

Получение полного профиля пользователя.

**Параметры пути:**
- `user_id` - UUID пользователя

**Ответ:** AccountProfileResponse

**POST** `/api/admin/v1/users/{user_id}/verify`

Верификация пользователя (требуется роль ADMIN).

**POST** `/api/admin/v1/users/{user_id}/unverify`

Снятие верификации пользователя (требуется роль ADMIN).

**POST** `/api/admin/v1/users/{user_id}/update/role`

Обновление роли пользователя (требуется роль SUPERUSER).

**Query параметры:**
- `name` - новая роль (`USER`, `ADMIN`, `SUPERUSER`)

**POST** `/api/admin/v1/users/{user_id}/password/reset`

Сброс пароля пользователя (требует роль SUPERUSER).

#### Управление конфигурациями

**GET** `/api/admin/v1/entities/configs`

Список всех конфигураций (CRUD, с пагинацией и фильтрацией).

**Query параметры:**
- `page`, `limit` - пагинация
- `type` - фильтр по типу
- `status` - фильтр по статусу
- `user_id` - фильтр по пользователю
- `client_id` - фильтр по client_id

**Ответ:** PagedResponse с ConfigResponse

**GET** `/api/admin/v1/entities/configs/{config_id}`

Информация о конфигурации.

**POST** `/api/admin/v1/configs/{config_id}/time/add`

Добавление времени действия конфигурации (требует роль ADMIN).

**Query параметры:**
- `days` - количество дней (0-90, по умолчанию: 30)
- `hours` - количество часов (0-23, по умолчанию: 0)

**Ответ:** ConfigResponse

**POST** `/api/admin/v1/configs/{config_id}/time/remove`

Удаление времени действия конфигурации (требуется роль ADMIN).

**Query параметры:**
- `days` - количество дней (0-90)
- `hours` - количество часов (0-23)

**Ответ:** ConfigResponse

#### Управление профилями

**GET** `/api/admin/v1/entities/profiles`

Список профилей (CRUD, с пагинацией и фильтрацией).

**GET** `/api/admin/v1/entities/profiles/{profile_id}`

Информация о профиле.

**PATCH** `/api/admin/v1/entities/profiles/{profile_id}`

Обновление профиля.

**Тело запроса:**
```json
{
  "email": "new_email@example.com",
  "first_name": "Имя",
  "last_name": "Фамилия"
}
```

#### Управление социальными сетями

**GET** `/api/admin/v1/entities/socials`

Список социальных сетей (CRUD, с пагинацией и фильтрацией).

**GET** `/api/admin/v1/entities/socials/{social_id}`

Информация о социальной сети.

**PATCH** `/api/admin/v1/entities/socials/{social_id}`

Обновление социальной сети.

#### Управление сессиями

**GET** `/api/admin/v1/entities/sessions`

Список всех сессий (CRUD, с пагинацией и фильтрацией).

**POST** `/api/admin/v1/sessions/revoke/token`

Отзыв access token (требуется роль ADMIN).

**Query параметры:**
- `token` - access token для отзыва

**Ответ:**
```json
{
  "msg": "Success"
}
```

**POST** `/api/admin/v1/sessions/cleanup`

Очистка истекших сессий (требуется роль ADMIN).

**Ответ:**
```json
{
  "msg": "Cleaned up 10 expired sessions",
  "cleaned_count": "10"
}
```

#### Управление запросами

**GET** `/api/admin/v1/entities/requests`

Список запросов пользователей (CRUD, с пагинацией и фильтрацией).

**GET** `/api/admin/v1/entities/requests/{request_id}`

Информация о запросе.

**POST** `/api/admin/v1/requests/{request_id}/apply`

Применение запроса (требуется роль ADMIN).

**Ответ:**
```json
{
  "msg": "Request applied successfully"
}
```

**POST** `/api/admin/v1/requests/{request_id}/deny`

Отклонение запроса (требуется роль ADMIN).

**Ответ:**
```json
{
  "msg": "Success"
}
```

#### Управление новостями

**GET** `/api/admin/v1/entities/news`

Список новостей (CRUD, с пагинацией и фильтрацией, требует роль SUPERUSER).

**POST** `/api/admin/v1/entities/news`

Создание новости (требуется роль SUPERUSER).

**Тело запроса:**
```json
{
  "title": "Заголовок новости",
  "content": "Содержание новости",
  "is_published": true
}
```

**GET** `/api/admin/v1/entities/news/{news_id}`

Информация о новости.

**PATCH** `/api/admin/v1/entities/news/{news_id}`

Обновление новости.

**DELETE** `/api/admin/v1/entities/news/{news_id}`

Удаление новости.

#### Управление уведомлениями

**POST** `/api/admin/v1/notifications/cleanup`

Очистка истекших уведомлений (требуется роль ADMIN).

**Ответ:**
```json
{
  "msg": "Cleaned up 5 expired notifications",
  "cleaned_count": "5"
}
```

#### Интеграция с XUI

**GET** `/api/admin/v1/xui/status`

Проверка статуса подключения к 3X-UI (требуется роль ADMIN).

**Ответ:**
```json
{
  "connected": true,
  "version": "2.8.5"
}
```

**GET** `/api/admin/v1/xui/inbounds`

Получение списка всех inbounds из 3X-UI (требуется роль ADMIN).

**Ответ:** Список InboundResponse

**GET** `/api/admin/v1/xui/inbounds/{remark}`

Получение конкретного inbound по remark (требуется роль ADMIN).

**Параметры пути:**
- `remark` - тип конфигурации (`VLESS`, `TROJAN`)

**Ответ:** InboundResponse

**Ошибки:**
- `xui_error` - ошибка подключения или запроса к 3X-UI

#### Управление ролями

**GET** `/api/admin/v1/entities/roles`

Список ролей (CRUD, с пагинацией и фильтрацией).

**GET** `/api/admin/v1/entities/roles/{role_id}`

Информация о роли.

## Пагинация

Для endpoints, возвращающих списки, используется пагинация через query параметры:

- `page` - номер страницы (начинается с 1)
- `limit` - количество элементов на странице

**Пример:**
```
GET /api/backend/v1/news?page=1&limit=20
```

**Ответ:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true
  },
  "data": [...]
}
```

## Фильтрация

Фильтрация доступна через query параметры. Конкретные параметры зависят от endpoint и модели.

**Примеры:**

```
GET /api/admin/v1/entities/users?login=username&status=active
GET /api/admin/v1/entities/configs?type=VLESS&status=active
```

## Сортировка

Сортировка доступна через query параметры (если поддерживается endpoint):

- `sort_by` - поле для сортировки
- `order` - направление сортировки (`asc` или `desc`)

**Пример:**
```
GET /api/admin/v1/entities/users?sort_by=created_at&order=desc
```

## Аутентификация

Все защищенные endpoints требуют JWT токен в заголовке:

```
Authorization: Bearer {access_token}
```

Access token имеет ограниченное время жизни (по умолчанию 20 минут). Для обновления используйте refresh token через `/api/auth/v1/refresh`.

## Роли и права доступа

Подробная информация о ролевой модели и правах доступа описана в разделе [Ролевая модель и права доступа](./roles.md).
