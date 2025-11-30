# Authentication and Authorization

## Authentication System Overview

The system uses JWT (JSON Web Tokens) for authentication. Upon login, the user receives a pair of tokens: access token (short-lived) and refresh token (long-lived). All tokens are stored in Redis for fast validation and revocation capability.

## JWT Tokens

### Access Token

Access token is used to access protected endpoints. Has a limited lifetime (default 20 minutes, configurable via `AUTH_ACCESS_TOKEN_EXPIRE_SEC`).

**Features:**
- Short lifetime for security
- Stored in Redis with TTL equal to token lifetime
- Contains user information (id, role)
- Used in the `Authorization: Bearer {access_token}` header

### Refresh Token

Refresh token is used to refresh the token pair. Has a long lifetime (default 30 days, configurable via `AUTH_REFRESH_TOKEN_EXPIRE_SEC`).

**Features:**
- Long lifetime
- Stored in Redis and database
- Linked to user session
- Used via query parameter `?token={refresh_token}`

### Token Structure

JWT token contains the following fields:

```json
{
  "type": "access" | "refresh",
  "sub": "user_uuid",
  "data": {
    "id": "user_uuid",
    "role": "user" | "admin" | "superuser"
  },
  "exp": 1234567890,
  "iat": 1234567890
}
```

- `type` - token type (ACCESS or REFRESH)
- `sub` - subject (user UUID)
- `data` - additional data (for access token: id, role)
- `exp` - expiration time (Unix timestamp)
- `iat` - creation time (Unix timestamp)

### Token Validation

On each request, the token is validated:
1. JWT decoding using `AUTH_JWT_MASTER_KEY`
2. Checking for required fields (type, sub, data, exp, iat)
3. Checking token presence in Redis (for revocation capability)
4. Checking token type (for access token - only ACCESS)

## Authentication Process

### Registration

**POST** `/api/auth/v1/register`

1. Data validation (login, password, email)
2. Checking that registration is not disabled
3. Password hashing using `APP_SALT`
4. Creating user with `NOT_VERIFIED` status
5. Creating user profile

**Login requirements:**
- Minimum 6 characters, maximum 20
- Must start with a letter
- Can contain letters, numbers, and underscores

### Login

**POST** `/api/auth/v1/login`

1. Finding user by login
2. Password verification
3. Creating session in database
4. Generating access token and refresh token
5. Saving tokens in Redis
6. Saving refresh token in database
7. Limiting number of active sessions (removing old ones if limit exceeded)

**Response:** Token pair (access and refresh)

### Token Refresh

**POST** `/api/auth/v1/refresh`

1. Refresh token validation
2. Checking presence in Redis and database
3. Checking refresh token activity
4. Creating new token pair
5. Updating session in database
6. Saving new tokens in Redis

**Response:** New token pair

### Logout

**POST** `/api/auth/v1/logout`

1. Deactivating current session in database
2. Deactivating refresh token in database
3. Removing access token from Redis
4. Removing refresh token from Redis

## Token Storage

### Redis

Tokens are stored in Redis for fast validation and revocation capability:

- **Access token:** key `{user_id}:{token}`, TTL = token lifetime
- **Refresh token:** key `{user_id}:{token}`, TTL = token lifetime

When validating a token, its presence in Redis is checked. If the token is not found - it is considered invalid.

### Database

The database stores:

- **Sessions (Session):** information about each active user session
  - `session_token` - access token
  - `user_id` - user ID
  - `user_agent`, `ip_address`, `device_info` - request metadata
  - `expires_at` - expiration time
  - `last_activity` - last activity
  - `is_active` - activity status

- **Refresh tokens (RefreshToken):** long-lived tokens for refresh
  - `token` - refresh token
  - `user_id` - user ID
  - `session_id` - link to session
  - `expires_at` - expiration time
  - `is_active` - activity status

## Sessions

### Session Creation

Session is created automatically upon login. The session stores:
- Access token
- Request metadata (User-Agent, IP address, device information)
- Creation and expiration time
- Session name (automatically determined from User-Agent)

### Session Management

User can:
- View list of all active sessions
- Terminate specific session
- Terminate all sessions (with option to exclude current)

### Session Limit

The system limits the number of simultaneous active sessions per user (default 3, configurable via `AUTH_MAX_SESSIONS`).

When the limit is exceeded, the oldest session (by `last_activity`) is automatically deactivated.

### Expired Session Cleanup

Administrators can trigger cleanup of expired sessions via endpoint `/api/admin/v1/sessions/cleanup`. The system removes all sessions where `expires_at` is less than current time.

## Security

### Password Hashing

Passwords are hashed using **PBKDF2-SHA256** algorithm with salt from `APP_SALT`.

**Process:**
1. Salt is added to password (`password + APP_SALT`)
2. PBKDF2-SHA256 is applied
3. Hash is saved to database

**Verification:**
1. Salt is added to entered password
2. Hash is computed
3. Compared with saved hash

### Rate Limiting

The system uses rate limiting to protect against brute force attacks:

- **Global limit:** applied to all endpoints (configurable via `RATE_LIMIT_DEFAULT_REQUESTS_PER_MINUTE`, default 60 requests per minute)
- **Special limits:** stricter limits can be set for authentication endpoints
- **Exceptions:** certain IP addresses can be excluded from rate limiting (configurable via `RATE_LIMIT_EXCLUDE_IP_ADDRESSES`)

When limit is exceeded, `rate_limit_error` (HTTP 429) is returned.

### Attack Protection

- **CORS:** configured to allow requests only from allowed domains (configurable via `APP_ALLOWED_DOMAINS`)
- **Security Headers:** security headers are automatically added to responses
- **Token Validation:** each token is checked for validity and presence in Redis
- **Token Revocation:** ability to immediately revoke tokens by removing from Redis

### CORS Settings

CORS is configured to work only with allowed domains:

- `allow_origins` - list of allowed domains from `APP_ALLOWED_DOMAINS`
- `allow_credentials` - credentials allowed (for working with cookies)
- `allow_methods` - allowed methods: GET, POST, DELETE, PATCH, OPTIONS
- `allow_headers` - allowed headers: Authorization, Content-Type

## Social Authentication

### Supported Providers

Currently only **Telegram** is supported via Telegram WebApp.

### OAuth Process

**POST** `/api/auth/v1/login/social/telegram`

**Telegram authorization process:**

1. **Telegram Data Validation:**
   - Checking hash parameter from Telegram WebApp `init_data`
   - Signature verification using bot token (`APP_TELEGRAM_BOT_TOKEN`)

2. **Finding or Creating User:**
   - Searching for existing social network link with user
   - If not found - creating new user:
     - Generating random password
     - Creating login in format `#telegram_{telegram_id}`
     - Creating profile with Telegram data
     - Creating record in Social table

3. **Creating Session and Tokens:**
   - Creating session with metadata
   - Generating token pair
   - Saving tokens in Redis and database

**Telegram Data Requirements:**
- `id` - user ID in Telegram
- `first_name` - user first name
- `auth_date` - authorization time
- `hash` - signature for authenticity verification
- Optional: `last_name`, `username`, `photo_url`, `language_code`

**Security:**
- Hash signature verification using bot secret key
- Using `hmac.compare_digest` to protect against timing attacks
- Validation of all incoming data

