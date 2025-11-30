# API Documentation

## API Overview

### Base URL

All API endpoints are available at base URL: `https://your-domain.com/api`

### Versioning

API uses versioning via `/v1` prefix in URL:
- `/api/app/v1/` - public endpoints
- `/api/auth/v1/` - authentication
- `/api/backend/v1/` - user endpoints
- `/api/admin/v1/` - administrative endpoints

### Request and Response Format

- **Request Format:** JSON (Content-Type: `application/json`)
- **Response Format:** JSON
- **Encoding:** UTF-8

### HTTP Status Codes

- `200 OK` - successful request
- `201 Created` - resource created
- `400 Bad Request` - invalid request
- `401 Unauthorized` - authentication required
- `403 Forbidden` - insufficient rights
- `404 Not Found` - resource not found
- `409 Conflict` - conflict (unique constraint, foreign key)
- `422 Unprocessable Entity` - validation error
- `429 Too Many Requests` - rate limit exceeded
- `500 Internal Server Error` - internal server error
- `501 Not Implemented` - feature not implemented

### Error Handling

Errors are returned in JSON format with error code:

```json
{
  "detail": "error_code: Error description or ERRORTAG:[timestamp]"
}
```

**Error Types (ErrorCode):**

- `unexpected_error` - unexpected error (500)
- `object_not_found` - object not found (404)
- `object_foreign_key_error` - foreign key violation (409)
- `unique_violation_error` - uniqueness violation (409)
- `validation_error` - validation error (422)
- `registration_disabled_error` - registration disabled (403)
- `permission_error` - insufficient rights (403)
- `rate_limit_error` - rate limit exceeded (429)
- `not_authorized_error` - not authorized (401)
- `not_implemented_error` - not implemented (501)
- `xui_error` - XUI integration error (400)
- `user_not_verified_error` - user not verified (403)

## Public Endpoints

### `/api/app/v1/`

#### Health Check

**GET** `/api/app/v1/health`

Check application status and service availability.

**Response:**
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

#### Application Settings

**GET** `/api/app/v1/settings`

Get public application settings. Requires authentication (USER role).

**Headers:**
- `Authorization: Bearer {access_token}`

**Response:**
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

Update application settings. Requires SUPERUSER role.

**Headers:**
- `Authorization: Bearer {access_token}`

**Request Body:**
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

## Authentication and Authorization

### `/api/auth/v1/`

#### Registration

**POST** `/api/auth/v1/register`

Register a new user.

**Request Body:**
```json
{
  "user": {
    "login": "username",
    "password": "secure_password"
  },
  "profile": {
    "email": "user@example.com",
    "first_name": "First Name",
    "last_name": "Last Name"
  }
}
```

**Login Validation:**
- Minimum 6 characters, maximum 20
- Must start with a letter
- Can contain letters, numbers, and underscores

**Response:**
```json
{
  "msg": "Success"
}
```

**Errors:**
- `registration_disabled_error` - registration disabled
- `unique_violation_error` - user with such login already exists
- `validation_error` - data validation error

#### Login

**POST** `/api/auth/v1/login`

Login and get JWT tokens.

**Request Body:**
```json
{
  "login": "username",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token"
}
```

**Errors:**
- `not_authorized_error` - invalid login or password
- `user_not_verified_error` - user not verified

#### Social Authentication

**POST** `/api/auth/v1/login/social/{name}`

Authentication via social networks. Only Telegram is supported.

**Path Parameters:**
- `name` - social network name (`telegram`)

**Request Body (for Telegram):**
```json
{
  "id": 123456789,
  "first_name": "First Name",
  "last_name": "Last Name",
  "username": "username",
  "photo_url": "https://...",
  "auth_date": 1234567890,
  "hash": "hash_string"
}
```

**Response:** JWT token pair

**Errors:**
- `not_implemented_error` - social network not supported
- `validation_error` - invalid Telegram data

#### Token Refresh

**POST** `/api/auth/v1/refresh`

Refresh access token using refresh token.

**Query Parameters:**
- `token` - refresh token

**Example:**
```
POST /api/auth/v1/refresh?token={refresh_token}
```

**Response:** New token pair

**Errors:**
- `not_authorized_error` - invalid or expired refresh token

#### Logout

**POST** `/api/auth/v1/logout`

Logout and deactivate current session.

**Headers:**
- `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "msg": "Success"
}
```

#### Password Recovery

**POST** `/api/auth/v1/forgot-password`

Request password recovery.

**Query Parameters:**
- `login` - user login

**Response:**
```json
{
  "msg": "Success"
}
```

#### Change Password

**POST** `/api/auth/v1/change-password`

Change current user password. After change, all sessions will be terminated.

**Headers:**
- `Authorization: Bearer {access_token}`

**Request Body:**
```json
{
  "old_password": "old_password",
  "new_password": "new_secure_password"
}
```

**Response:**
```json
{
  "msg": "Success"
}
```

**Errors:**
- `not_authorized_error` - invalid old password
- `validation_error` - new password does not meet requirements

#### Current User Information

**GET** `/api/auth/v1/me`

Get information about current authenticated user.

**Headers:**
- `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "id": "uuid",
  "role": "USER"
}
```

#### Verification Request

**POST** `/api/auth/v1/request-verification`

Request account verification.

**Headers:**
- `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "msg": "Success"
}
```

#### Permission Check

**POST** `/api/auth/v1/check-permission`

Check if user has a specific role.

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**
- `role` - role to check (`USER`, `ADMIN`, `SUPERUSER`)

**Response:**
```json
{
  "msg": "Granted"
}
```

**Errors:**
- `permission_error` - insufficient rights

#### Account Management

**GET** `/api/auth/v1/account/profile`

Get full account profile (user, profile, social networks).

**Headers:**
- `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "login": "username",
    "status": "active"
  },
  "profile": {
    "email": "user@example.com",
    "first_name": "First Name",
    "last_name": "Last Name"
  },
  "socials": []
}
```

**PATCH** `/api/auth/v1/account/profile`

Update account profile.

**Headers:**
- `Authorization: Bearer {access_token}`

**Request Body:**
```json
{
  "email": "new_email@example.com",
  "first_name": "New First Name",
  "last_name": "New Last Name"
}
```

**GET** `/api/auth/v1/account/notifications`

Get list of user notifications (with pagination).

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**
- `page` - page number (default: 1)
- `limit` - number of items (default: 10)

**Response:** PagedResponse with notifications

#### Session Management

**GET** `/api/auth/v1/sessions/`

Get list of active user sessions (with pagination).

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**
- `page` - page number
- `limit` - number of items

**Response:** PagedResponse with sessions

**DELETE** `/api/auth/v1/sessions/terminate/{session_id}`

Terminate specific session.

**Headers:**
- `Authorization: Bearer {access_token}`

**Path Parameters:**
- `session_id` - session UUID

**Response:**
```json
{
  "msg": "Success"
}
```

**DELETE** `/api/auth/v1/sessions/terminate-all`

Terminate all user sessions.

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**
- `exclude_current` - exclude current session (default: `true`)

**Response:**
```json
{
  "msg": "Successfully terminated all active sessions, except current"
}
```

## User Endpoints

### `/api/backend/v1/`

To interact with all endpoints, a user account with USER role must meet the following criteria:
* account is authenticated;
* account is verified by a user with ADMIN or SUPERUSER roles

**Headers:**
- `Authorization: Bearer {access_token}`

#### Configurations

**GET** `/api/backend/v1/client/configs`

Get list of user configurations (with pagination).

**Query Parameters:**
- `page` - page number
- `limit` - number of items

**Response:** PagedResponse with ConfigSimpleResponse

**GET** `/api/backend/v1/client/configs/by-type/{type}`

Get or create configuration of specific type.

**Path Parameters:**
- `type` - configuration type (`VLESS`, `TROJAN`)

**Response:** ConfigResponse

**POST** `/api/backend/v1/client/configs/{config_id}/renew`

Create configuration renewal request.

**Path Parameters:**
- `config_id` - configuration UUID

**Response:**
```json
{
  "msg": "Success"
}
```

**POST** `/api/backend/v1/client/configs/{config_id}/update-limits`

Create configuration limits update request.

**Path Parameters:**
- `config_id` - configuration UUID

**Request Body:**
```json
{
  "total_gb": 200,
  "limit_ip": 5
}
```

**Response:**
```json
{
  "msg": "Success"
}
```

#### News

**GET** `/api/backend/v1/news`

Get list of news (with pagination).

**Query Parameters:**
- `page` - page number
- `limit` - number of items

**Response:** PagedResponse with NewsResponse

## Administrative Endpoints

### `/api/admin/v1/`

All endpoints require authentication and ADMIN or SUPERUSER role (depending on endpoint). At the same time, all authenticated users with ADMIN and SUPERUSER roles do not require verification.

**Headers:**
- `Authorization: Bearer {access_token}`

#### User Management

**GET** `/api/admin/v1/entities/users`

List of users (CRUD, with pagination and filtering).

**Query Parameters:**
- `page` - page number
- `limit` - number of items
- `login` - filter by login
- `status` - filter by status

**Response:** PagedResponse with UserResponse

**GET** `/api/admin/v1/entities/users/{user_id}`

Information about specific user.

**GET** `/api/admin/v1/users/{user_id}/profile`

Get full user profile.

**Path Parameters:**
- `user_id` - user UUID

**Response:** AccountProfileResponse

**POST** `/api/admin/v1/users/{user_id}/verify`

Verify user (requires ADMIN role).

**POST** `/api/admin/v1/users/{user_id}/unverify`

Remove user verification (requires ADMIN role).

**POST** `/api/admin/v1/users/{user_id}/update/role`

Update user role (requires SUPERUSER role).

**Query Parameters:**
- `name` - new role (`USER`, `ADMIN`, `SUPERUSER`)

**POST** `/api/admin/v1/users/{user_id}/password/reset`

Reset user password (requires SUPERUSER role).

#### Configuration Management

**GET** `/api/admin/v1/entities/configs`

List of all configurations (CRUD, with pagination and filtering).

**Query Parameters:**
- `page`, `limit` - pagination
- `type` - filter by type
- `status` - filter by status
- `user_id` - filter by user
- `client_id` - filter by client_id

**Response:** PagedResponse with ConfigResponse

**GET** `/api/admin/v1/entities/configs/{config_id}`

Configuration information.

**POST** `/api/admin/v1/configs/{config_id}/time/add`

Add configuration validity time (requires ADMIN role).

**Query Parameters:**
- `days` - number of days (0-90, default: 30)
- `hours` - number of hours (0-23, default: 0)

**Response:** ConfigResponse

**POST** `/api/admin/v1/configs/{config_id}/time/remove`

Remove configuration validity time (requires ADMIN role).

**Query Parameters:**
- `days` - number of days (0-90)
- `hours` - number of hours (0-23)

**Response:** ConfigResponse

#### Profile Management

**GET** `/api/admin/v1/entities/profiles`

List of profiles (CRUD, with pagination and filtering).

**GET** `/api/admin/v1/entities/profiles/{profile_id}`

Profile information.

**PATCH** `/api/admin/v1/entities/profiles/{profile_id}`

Update profile.

**Request Body:**
```json
{
  "email": "new_email@example.com",
  "first_name": "First Name",
  "last_name": "Last Name"
}
```

#### Social Network Management

**GET** `/api/admin/v1/entities/socials`

List of social networks (CRUD, with pagination and filtering).

**GET** `/api/admin/v1/entities/socials/{social_id}`

Social network information.

**PATCH** `/api/admin/v1/entities/socials/{social_id}`

Update social network.

#### Session Management

**GET** `/api/admin/v1/entities/sessions`

List of all sessions (CRUD, with pagination and filtering).

**POST** `/api/admin/v1/sessions/revoke/token`

Revoke access token (requires ADMIN role).

**Query Parameters:**
- `token` - access token to revoke

**Response:**
```json
{
  "msg": "Success"
}
```

**POST** `/api/admin/v1/sessions/cleanup`

Cleanup expired sessions (requires ADMIN role).

**Response:**
```json
{
  "msg": "Cleaned up 10 expired sessions",
  "cleaned_count": "10"
}
```

#### Request Management

**GET** `/api/admin/v1/entities/requests`

List of user requests (CRUD, with pagination and filtering).

**GET** `/api/admin/v1/entities/requests/{request_id}`

Request information.

**POST** `/api/admin/v1/requests/{request_id}/apply`

Apply request (requires ADMIN role).

**Response:**
```json
{
  "msg": "Request applied successfully"
}
```

**POST** `/api/admin/v1/requests/{request_id}/deny`

Deny request (requires ADMIN role).

**Response:**
```json
{
  "msg": "Success"
}
```

#### News Management

**GET** `/api/admin/v1/entities/news`

List of news (CRUD, with pagination and filtering, requires SUPERUSER role).

**POST** `/api/admin/v1/entities/news`

Create news (requires SUPERUSER role).

**Request Body:**
```json
{
  "title": "News Title",
  "content": "News Content",
  "is_published": true
}
```

**GET** `/api/admin/v1/entities/news/{news_id}`

News information.

**PATCH** `/api/admin/v1/entities/news/{news_id}`

Update news.

**DELETE** `/api/admin/v1/entities/news/{news_id}`

Delete news.

#### Notification Management

**POST** `/api/admin/v1/notifications/cleanup`

Cleanup expired notifications (requires ADMIN role).

**Response:**
```json
{
  "msg": "Cleaned up 5 expired notifications",
  "cleaned_count": "5"
}
```

#### XUI Integration

**GET** `/api/admin/v1/xui/status`

Check 3X-UI connection status (requires ADMIN role).

**Response:**
```json
{
  "connected": true,
  "version": "2.8.5"
}
```

**GET** `/api/admin/v1/xui/inbounds`

Get list of all inbounds from 3X-UI (requires ADMIN role).

**Response:** List of InboundResponse

**GET** `/api/admin/v1/xui/inbounds/{remark}`

Get specific inbound by remark (requires ADMIN role).

**Path Parameters:**
- `remark` - configuration type (`VLESS`, `TROJAN`)

**Response:** InboundResponse

**Errors:**
- `xui_error` - connection or request error to 3X-UI

#### Role Management

**GET** `/api/admin/v1/entities/roles`

List of roles (CRUD, with pagination and filtering).

**GET** `/api/admin/v1/entities/roles/{role_id}`

Role information.

## Pagination

For endpoints returning lists, pagination is used via query parameters:

- `page` - page number (starts at 1)
- `limit` - number of items per page

**Example:**
```
GET /api/backend/v1/news?page=1&limit=20
```

**Response:**
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

## Filtering

Filtering is available via query parameters. Specific parameters depend on endpoint and model.

**Examples:**

```
GET /api/admin/v1/entities/users?login=username&status=active
GET /api/admin/v1/entities/configs?type=VLESS&status=active
```

## Sorting

Sorting is available via query parameters (if endpoint supports it):

- `sort_by` - field to sort by
- `order` - sort direction (`asc` or `desc`)

**Example:**
```
GET /api/admin/v1/entities/users?sort_by=created_at&order=desc
```

## Authentication

All protected endpoints require JWT token in header:

```
Authorization: Bearer {access_token}
```

Access token has limited lifetime (default 20 minutes). For refresh, use refresh token via `/api/auth/v1/refresh`.

## Roles and Access Rights

Detailed information about role model and access rights is described in the [Role Model and Access Rights](./roles.md) section.

