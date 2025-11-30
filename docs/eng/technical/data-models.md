# Data Models

## Models Overview

The database uses PostgreSQL and consists of the following main models:

- **Users:** User, Role, Session, Refresh
- **Configurations:** Config, Profile
- **Requests:** Request
- **Notifications:** Notification, News
- **Social Networks:** Social
- **Settings:** AppSettings

All models inherit from the base class `Base`, which adds:
- `id` - UUID primary key
- `_inserted_dttm` - record creation time
- `_updated_dttm` - last update time

## User Models

### User

Main user model.

**Fields:**
- `login` - unique user login (String(255), unique, indexed)
- `password` - hashed password (String(255))
- `role_id` - reference to role (ForeignKey → Role.id, CASCADE on delete)
- `status` - user status (String(255), default `NOT_VERIFIED`)

**Relationships:**
- One-to-one with `Profile`
- One-to-many with `Session`, `Refresh`, `Config`, `Request`, `Notification`, `Social`

### Role

User roles in the system.

**Fields:**
- `name` - role name (String(255), unique): `superuser`, `admin`, `user`
- `weight` - role weight for access rights comparison (Integer)

**Hierarchy:** SUPERUSER (weight 0) < ADMIN (weight 1) < USER (weight 2)

### Session

Active user sessions.

**Fields:**
- `user_id` - reference to user (ForeignKey → User.id, CASCADE)
- `session_token` - session access token (String(1024), unique)
- `user_agent` - browser User-Agent (String(1000))
- `ip_address` - client IP address (String(255))
- `device_info` - device information (String(255))
- `session_name` - session name (String(255))
- `is_active` - whether session is active (Boolean, default `true`)
- `expires_at` - session expiration time (DateTime)
- `last_activity` - last activity time (DateTime)

**Indexes:**
- Composite index on `user_id` and `is_active`

### RefreshToken (Refresh)

Refresh tokens for refreshing access tokens.

**Fields:**
- `token` - refresh token (String(1024))
- `user_id` - reference to user (ForeignKey → User.id, CASCADE)
- `session_id` - reference to session (ForeignKey → Session.id, CASCADE)
- `expires_at` - token expiration time (DateTime)
- `is_active` - whether token is active (Boolean, default `true`)

**Indexes:**
- On `token`
- On `user_id`

## Configuration Models

### Config

VPN configurations for users.

**Fields:**
- `type` - configuration type (String(100)): `VLESS`, `TROJAN`
- `status` - configuration status (String(100), default `NOT_UPDATED`): `NOT_UPDATED`, `UPDATE_PENDING`, `UPDATED`
- `user_id` - reference to user (ForeignKey → User.id, CASCADE)
- `client_id` - client ID in 3X-UI (String(255))
- `client_email` - client email (String(255))
- `used_gb` - used traffic in GB (Float, default 0)
- `total_gb` - total traffic limit in GB (Integer)
- `limit_ip` - IP address limit (Integer)
- `subscription_url` - subscription URL (String(1000))
- `connection_url` - connection URL (String(1000))
- `valid_from_dttm` - configuration start time (DateTime)
- `valid_to_dttm` - configuration end time (DateTime)

**Constraints:**
- Unique combination of `user_id` and `type` (one user can have only one configuration of each type)

### Profile

User profile with additional information.

**Fields:**
- `user_id` - reference to user (ForeignKey → User.id, CASCADE, unique)
- `first_name` - first name (String(255), indexed)
- `last_name` - last name (String(255), nullable)
- `lang_code` - language code (String(4))
- `email` - email address (String(255), nullable, indexed)

**Constraints:**
- One profile per user (unique `user_id`)

## Request Models

### Request

User requests for various actions (verification, password reset, configuration update, etc.).

**Fields:**
- `user_id` - reference to user (ForeignKey → User.id, CASCADE)
- `name` - request type (String(255)): `VERIFY`, `RESET_PASSWORD`, `UPDATE_CONFIG`, `RENEW_CONFIG`, `EXPIRE_CONFIG`
- `related_id` - related entity ID (UUID)
- `related_name` - related entity type (String(255)): `USER`, `CONFIG`
- `data` - additional request data (JSONB, default `{}`)

**Constraints:**
- Unique combination of `user_id`, `name` and `related_id`

## Notification Models

### Notification

Personal notifications for users.

**Fields:**
- `title` - notification title (JSONB, multilingual)
- `content` - notification content (JSONB, multilingual)
- `user_id` - notification recipient (ForeignKey → User.id, CASCADE)
- `request_name` - request type related to notification (String(255), nullable)
- `request_status` - request status (String(255), nullable): `NEW`, `APPLIED`
- `related_name` - related entity type (String(255), nullable)
- `related_id` - related entity ID (UUID, nullable)
- `sent_in_social` - social network used for sending (String(128), nullable): `telegram`
- `sent_at` - sending time (DateTime, nullable)

**Indexes:**
- On `user_id`
- On `sent_in_social`
- On `sent_at`

### News

News for all users.

**Fields:**
- `title` - news title (JSONB, multilingual)
- `content` - news content (JSONB, multilingual)

**Indexes:**
- On `title`

## Social Network Models

### Social

User connections with social networks.

**Fields:**
- `login` - login in social network (String(255), indexed)
- `name` - social network name (String(255)): `telegram`, `yandex`
- `email` - email from social network (String(255), nullable)
- `user_id` - reference to user (ForeignKey → User.id, CASCADE)

**Constraints:**
- Unique combination of `name` and `user_id` (one user can have only one connection with each social network)

**Indexes:**
- On `login`
- On `user_id`

## Settings Models

### AppSettings

Application settings.

**Fields:**
- `name` - setting name (String(100), unique): `basic`, `service`
- `values` - setting values (JSONB, default `{}`)

**Constraints:**
- Unique `name`

## Model Relationships

**User (1) → (N) Session** - one user can have many sessions

**User (1) → (N) Refresh** - one user can have many refresh tokens

**User (1) → (1) Profile** - one user has one profile

**User (1) → (N) Config** - one user can have many configurations (different types)

**User (1) → (N) Request** - one user can create many requests

**User (1) → (N) Notification** - one user can receive many notifications

**User (1) → (N) Social** - one user can have connections with multiple social networks

**User (N) → (1) Role** - many users can have one role

**Session (1) → (N) Refresh** - one session can have many refresh tokens (on refresh)

**Config (N) → (1) User** - many configurations belong to one user

## Indexes and Constraints

**Performance Indexes:**
- `idx_user_login` - fast user search by login
- `idx_session_user_id_is_active` - fast search for active user sessions
- `idx_refresh_token_token` - fast refresh token search
- `idx_refresh_token_user_id` - fast search for user refresh tokens
- `idx_profile_first_name` - search by first name
- `idx_profile_email` - search by email
- `idx_social_login` - search connection by social network login
- `idx_social_user_id` - search user connections
- `idx_personal_notification_user_id` - fast search for user notifications
- `idx_personal_notification_sent_in_social` - filtering by social network
- `idx_personal_notification_sent_at` - sorting by sending time
- `idx_news_title` - news search

**Unique Constraints:**
- `user.login` - unique login
- `role.name` - unique role name
- `session.session_token` - unique session token
- `uq_config_user_id_type` - one user - one configuration of each type
- `uq_profile_user_id` - one profile per user
- `uq_request_user_id_name_related_id` - unique request
- `uq_social_name_user_id` - one connection with each social network per user
- `uq_settings_name` - unique setting name

**CASCADE on Delete:**
- When `User` is deleted, the following are automatically deleted: `Session`, `Refresh`, `Config`, `Profile`, `Request`, `Notification`, `Social`
- When `Session` is deleted, related `Refresh` tokens are automatically deleted
- When `Role` is deleted, users with that role get `role_id = NULL`

