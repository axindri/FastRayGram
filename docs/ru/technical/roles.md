# Ролевая модель и права доступа

## Обзор ролевой модели

Система использует иерархическую ролевую модель с тремя уровнями доступа. Права доступа проверяются на основе весов ролей: роль с меньшим весом имеет больше прав.

## Роли пользователей

### SUPERUSER

Суперпользователь с максимальными правами доступа.

**Права:**
- Полный доступ ко всем функциям системы
- Управление настройками системы: изменение, включение/выключение регистрации и других параметров приложения
- Назначение администраторов: изменение ролей пользователей (включая назначение роли ADMIN)
- Управление новостями
- Сброс паролей пользователей
- Все права ADMIN и USER

**Вес:** 0 (наивысший приоритет)

### ADMIN

Администратор с правами управления пользователями и конфигурациями.

**Права:**
- Управление пользователями (просмотр, верификация)
- Управление конфигурациями (добавление/удаление времени)
- Управление запросами (применение, отклонение)
- Управление уведомлениями (очистка)
- Управление сессиями (отзыв токенов, очистка)
- Интеграция с XUI
- CRUD операции для всех сущностей
- Все права USER

**Вес:** 1

### USER

Обычный пользователь с базовыми правами.

**Права:**
- Просмотр и управление своими конфигурациями
- Просмотр новостей
- Управление своим профилем
- Управление своими сессиями
- Создание запросов (верификация, обновление конфигурации)

**Вес:** 2 (низший приоритет)

## Иерархия ролей

### Веса ролей

Роли имеют числовые веса для сравнения прав доступа:

- **SUPERUSER** - вес 0 (наивысший)
- **ADMIN** - вес 1
- **USER** - вес 2 (низший)

Вес определяется порядком роли в перечислении `UserRoles`.

### Проверка прав доступа

Проверка прав основана на сравнении весов ролей:

```python
user_role_weight <= required_role_weight
```

Если вес роли пользователя меньше или равен требуемому весу - доступ разрешен.

**Примеры:**
- SUPERUSER (0) <= ADMIN (1) - доступ разрешен
- ADMIN (1) <= ADMIN (1) - доступ разрешен
- USER (2) <= ADMIN (1) - доступ запрещен

При отсутствии прав возвращается ошибка `permission_error` (HTTP 403).

## Распределение прав по endpoints

### Публичные endpoints

Не требуют аутентификации:

- `GET /api/app/v1/health` - проверка статуса

### Endpoints для авторизованных пользователей

Требуют роль **USER** и аутентификацию:

- `GET /api/app/v1/settings` - настройки приложения
- `GET /api/backend/v1/news` - список новостей
- `GET /api/backend/v1/client/configs` - список конфигураций (требует верификации)
- `GET /api/backend/v1/client/configs/by-type/{type}` - получение конфигурации (требует верификации)
- `POST /api/backend/v1/client/configs/{config_id}/renew` - запрос на продление (требует верификации)
- `POST /api/backend/v1/client/configs/{config_id}/update-limits` - запрос на обновление лимитов (требует верификации)
- Все endpoints `/api/auth/v1/account/*` - управление аккаунтом
- Все endpoints `/api/auth/v1/sessions/*` - управление сессиями

### Endpoints для администраторов

Требуют роль **ADMIN** или выше:

- `GET /api/admin/v1/entities/*` - CRUD операции для всех сущностей
- `GET /api/admin/v1/users/{user_id}/profile` - профиль пользователя
- `POST /api/admin/v1/users/{user_id}/verify` - верификация пользователя
- `POST /api/admin/v1/users/{user_id}/unverify` - снятие верификации
- `POST /api/admin/v1/configs/{config_id}/time/add` - добавление времени конфигурации
- `POST /api/admin/v1/configs/{config_id}/time/remove` - удаление времени конфигурации
- `POST /api/admin/v1/requests/{request_id}/apply` - применение запроса
- `POST /api/admin/v1/requests/{request_id}/deny` - отклонение запроса
- `POST /api/admin/v1/notifications/cleanup` - очистка уведомлений
- `POST /api/admin/v1/sessions/revoke/token` - отзыв токена
- `POST /api/admin/v1/sessions/cleanup` - очистка сессий
- `GET /api/admin/v1/xui/*` - интеграция с XUI

### Endpoints для суперпользователей

Требуют роль **SUPERUSER**:

- `PATCH /api/app/v1/settings` - обновление настроек приложения
- `POST /api/admin/v1/users/{user_id}/update/role` - изменение роли пользователя
- `POST /api/admin/v1/users/{user_id}/password/reset` - сброс пароля пользователя
- `GET /api/admin/v1/entities/news` - список новостей (CRUD)
- `POST /api/admin/v1/entities/news` - создание новости
- `PATCH /api/admin/v1/entities/news/{news_id}` - обновление новости
- `DELETE /api/admin/v1/entities/news/{news_id}` - удаление новости

## Статусы пользователей

Помимо ролей, пользователи имеют статусы, которые влияют на доступ к некоторым функциям:

### NOT_VERIFIED

Пользователь не верифицирован (статус по умолчанию при регистрации).

**Ограничения:**
- Не может управлять конфигурациями
- Может создавать запросы на верификацию

### VERIFICATION_PENDING

Запрос на верификацию отправлен, ожидает рассмотрения администратором.

### VERIFIED

Пользователь верифицирован администратором.

**Доступ:**
- Полный доступ ко всем функциям согласно роли
- Может управлять конфигурациями

**Примечание:** Некоторые endpoints требуют верифицированного пользователя (например, управление конфигурациями). Проверка выполняется через dependency `required_verified_user`.

## Управление ролями

### Назначение ролей

При регистрации пользователю автоматически назначается роль **USER**. Роль **SUPERUSER** создается автоматически при первом запуске приложения (настраивается через `APP_SUPERUSER_LOGIN` и `APP_SUPERUSER_PASSWORD`).

### Изменение ролей

Изменение роли пользователя доступно только для **SUPERUSER**:

**POST** `/api/admin/v1/users/{user_id}/update/role?name={role}`

После изменения роли все активные сессии пользователя автоматически завершаются.

### Проверка прав в коде

Проверка прав выполняется через dependency `required_role`:

```python
from src.dependencies import required_role
from src.core.enums import UserRoles

@router.get('/endpoint', dependencies=[Depends(required_role(UserRoles.ADMIN))])
async def endpoint():
    ...
```

Или программно:

```python
from src.utils.permission import check_required_role

check_required_role(user_role, required_role)
```

## Примеры использования

**Пример 1: Endpoint для USER и выше**

```python
@router.get('/configs', dependencies=[Depends(required_role(UserRoles.USER))])
async def get_configs():
    ...
```

**Пример 2: Endpoint только для ADMIN и выше**

```python
@router.post('/users/{user_id}/verify', dependencies=[Depends(required_role(UserRoles.ADMIN))])
async def verify_user():
    ...
```

**Пример 3: Endpoint только для SUPERUSER**

```python
@router.patch('/settings', dependencies=[Depends(required_role(UserRoles.SUPERUSER))])
async def update_settings():
    ...
```

**Пример 4: Проверка прав программно**

```python
from src.utils.permission import check_required_role

user_role = UserRoles(user.role)
check_required_role(user_role, UserRoles.ADMIN)  # Вызовет PermissionError, если недостаточно прав
```
