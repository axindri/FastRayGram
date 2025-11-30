# Модели данных

## Обзор моделей

База данных использует PostgreSQL и состоит из следующих основных моделей:

- **Пользователи:** User, Role, Session, Refresh
- **Конфигурации:** Config, Profile
- **Запросы:** Request
- **Уведомления:** Notification, News
- **Социальные сети:** Social
- **Настройки:** AppSettings

Все модели наследуются от базового класса `Base`, который добавляет:
- `id` - UUID первичный ключ
- `_inserted_dttm` - время создания записи
- `_updated_dttm` - время последнего обновления

## Модели пользователей

### User

Основная модель пользователя.

**Поля:**
- `login` - уникальный логин пользователя (String(255), уникальный, индексирован)
- `password` - хешированный пароль (String(255))
- `role_id` - ссылка на роль (ForeignKey → Role.id, CASCADE при удалении)
- `status` - статус пользователя (String(255), по умолчанию `NOT_VERIFIED`)

**Связи:**
- Один к одному с `Profile`
- Один ко многим с `Session`, `Refresh`, `Config`, `Request`, `Notification`, `Social`

### Role

Роли пользователей в системе.

**Поля:**
- `name` - название роли (String(255), уникальный): `superuser`, `admin`, `user`
- `weight` - вес роли для сравнения прав доступа (Integer)

**Иерархия:** SUPERUSER (вес 0) < ADMIN (вес 1) < USER (вес 2)

### Session

Активные сессии пользователей.

**Поля:**
- `user_id` - ссылка на пользователя (ForeignKey → User.id, CASCADE)
- `session_token` - access token сессии (String(1024), уникальный)
- `user_agent` - User-Agent браузера (String(1000))
- `ip_address` - IP адрес клиента (String(255))
- `device_info` - информация об устройстве (String(255))
- `session_name` - название сессии (String(255))
- `is_active` - активна ли сессия (Boolean, по умолчанию `true`)
- `expires_at` - время истечения сессии (DateTime)
- `last_activity` - время последней активности (DateTime)

**Индексы:**
- Составной индекс по `user_id` и `is_active`

### RefreshToken (Refresh)

Refresh токены для обновления access токенов.

**Поля:**
- `token` - refresh token (String(1024))
- `user_id` - ссылка на пользователя (ForeignKey → User.id, CASCADE)
- `session_id` - ссылка на сессию (ForeignKey → Session.id, CASCADE)
- `expires_at` - время истечения токена (DateTime)
- `is_active` - активен ли токен (Boolean, по умолчанию `true`)

**Индексы:**
- По `token`
- По `user_id`

## Модели конфигураций

### Config

Конфигурации VPN для пользователей.

**Поля:**
- `type` - тип конфигурации (String(100)): `VLESS`, `TROJAN`
- `status` - статус конфигурации (String(100), по умолчанию `NOT_UPDATED`): `NOT_UPDATED`, `UPDATE_PENDING`, `UPDATED`
- `user_id` - ссылка на пользователя (ForeignKey → User.id, CASCADE)
- `client_id` - ID клиента в 3X-UI (String(255))
- `client_email` - email клиента (String(255))
- `used_gb` - использованный трафик в GB (Float, по умолчанию 0)
- `total_gb` - общий лимит трафика в GB (Integer)
- `limit_ip` - лимит IP адресов (Integer)
- `subscription_url` - URL подписки (String(1000))
- `connection_url` - URL подключения (String(1000))
- `valid_from_dttm` - начало действия конфигурации (DateTime)
- `valid_to_dttm` - окончание действия конфигурации (DateTime)

**Ограничения:**
- Уникальная комбинация `user_id` и `type` (один пользователь может иметь только одну конфигурацию каждого типа)

### Profile

Профиль пользователя с дополнительной информацией.

**Поля:**
- `user_id` - ссылка на пользователя (ForeignKey → User.id, CASCADE, уникальный)
- `first_name` - имя (String(255), индексирован)
- `last_name` - фамилия (String(255), nullable)
- `lang_code` - код языка (String(4))
- `email` - email адрес (String(255), nullable, индексирован)

**Ограничения:**
- Один профиль на пользователя (уникальный `user_id`)

## Модели запросов

### Request

Запросы пользователей на различные действия (верификация, сброс пароля, обновление конфигурации и т.д.).

**Поля:**
- `user_id` - ссылка на пользователя (ForeignKey → User.id, CASCADE)
- `name` - тип запроса (String(255)): `VERIFY`, `RESET_PASSWORD`, `UPDATE_CONFIG`, `RENEW_CONFIG`, `EXPIRE_CONFIG`
- `related_id` - ID связанной сущности (UUID)
- `related_name` - тип связанной сущности (String(255)): `USER`, `CONFIG`
- `data` - дополнительные данные запроса (JSONB, по умолчанию `{}`)

**Ограничения:**
- Уникальная комбинация `user_id`, `name` и `related_id`

## Модели уведомлений

### Notification

Персональные уведомления для пользователей.

**Поля:**
- `title` - заголовок уведомления (JSONB, мультиязычный)
- `content` - содержание уведомления (JSONB, мультиязычный)
- `user_id` - получатель уведомления (ForeignKey → User.id, CASCADE)
- `request_name` - тип запроса, связанного с уведомлением (String(255), nullable)
- `request_status` - статус запроса (String(255), nullable): `NEW`, `APPLIED`
- `related_name` - тип связанной сущности (String(255), nullable)
- `related_id` - ID связанной сущности (UUID, nullable)
- `sent_in_social` - через какую социальную сеть отправлено (String(128), nullable): `telegram`
- `sent_at` - время отправки (DateTime, nullable)

**Индексы:**
- По `user_id`
- По `sent_in_social`
- По `sent_at`

### News

Новости для всех пользователей.

**Поля:**
- `title` - заголовок новости (JSONB, мультиязычный)
- `content` - содержание новости (JSONB, мультиязычный)

**Индексы:**
- По `title`

## Модели социальных сетей

### Social

Связи пользователей с социальными сетями.

**Поля:**
- `login` - login в социальной сети (String(255), индексирован)
- `name` - название социальной сети (String(255)): `telegram`, `yandex`
- `email` - email из социальной сети (String(255), nullable)
- `user_id` - ссылка на пользователя (ForeignKey → User.id, CASCADE)

**Ограничения:**
- Уникальная комбинация `name` и `user_id` (один пользователь может иметь только одну связь с каждой социальной сетью)

**Индексы:**
- По `login`
- По `user_id`

## Модели настроек

### AppSettings

Настройки приложения.

**Поля:**
- `name` - название настройки (String(100), уникальный): `basic`, `service`
- `values` - значения настройки (JSONB, по умолчанию `{}`)

**Ограничения:**
- Уникальный `name`

## Связи между моделями

**User (1) → (N) Session** - один пользователь может иметь множество сессий

**User (1) → (N) Refresh** - один пользователь может иметь множество refresh токенов

**User (1) → (1) Profile** - один пользователь имеет один профиль

**User (1) → (N) Config** - один пользователь может иметь множество конфигураций (разных типов)

**User (1) → (N) Request** - один пользователь может создавать множество запросов

**User (1) → (N) Notification** - один пользователь может получать множество уведомлений

**User (1) → (N) Social** - один пользователь может иметь связи с несколькими социальными сетями

**User (N) → (1) Role** - множество пользователей могут иметь одну роль

**Session (1) → (N) Refresh** - одна сессия может иметь множество refresh токенов (при обновлении)

**Config (N) → (1) User** - множество конфигураций принадлежат одному пользователю

## Индексы и ограничения

**Индексы для производительности:**
- `idx_user_login` - быстрый поиск пользователя по login
- `idx_session_user_id_is_active` - быстрый поиск активных сессий пользователя
- `idx_refresh_token_token` - быстрый поиск refresh токена
- `idx_refresh_token_user_id` - быстрый поиск refresh токенов пользователя
- `idx_profile_first_name` - поиск по имени
- `idx_profile_email` - поиск по email
- `idx_social_login` - поиск связи по login в социальной сети
- `idx_social_user_id` - поиск связей пользователя
- `idx_personal_notification_user_id` - быстрый поиск уведомлений пользователя
- `idx_personal_notification_sent_in_social` - фильтрация по социальной сети
- `idx_personal_notification_sent_at` - сортировка по времени отправки
- `idx_news_title` - поиск новостей

**Уникальные ограничения:**
- `user.login` - уникальный логин
- `role.name` - уникальное название роли
- `session.session_token` - уникальный токен сессии
- `uq_config_user_id_type` - один пользователь - одна конфигурация каждого типа
- `uq_profile_user_id` - один профиль на пользователя
- `uq_request_user_id_name_related_id` - уникальный запрос
- `uq_social_name_user_id` - одна связь с каждой социальной сетью на пользователя
- `uq_settings_name` - уникальное название настройки

**CASCADE при удалении:**
- При удалении `User` автоматически удаляются: `Session`, `Refresh`, `Config`, `Profile`, `Request`, `Notification`, `Social`
- При удалении `Session` автоматически удаляются связанные `Refresh` токены
- При удалении `Role` пользователи с этой ролью получают `role_id = NULL`


