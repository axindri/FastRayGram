# Service Interactions

## Services Overview

The project consists of four main services:

- **Backend API Service** - main service providing REST API for managing users, configurations, sessions, and administrative functions
- **Frontend Service** - React web application providing user interface
- **Notificator Service** - background service for processing and sending notifications to users
- **Telegram Bot Service** - Telegram bot for integration with web application via Web App

All services interact through a shared PostgreSQL database and Redis (for caching and rate limiting).

## Backend API Service

### Main Functions

Backend API Service is a FastAPI application providing REST API for all system operations:

- **Authentication and Authorization**: registration, login, session management, JWT tokens (see [Authentication documentation](authentication.md) for details)
- **User Management**: profiles, verification, role management (see [Roles documentation](roles.md) for details)
- **Configuration Management**: creating, updating, renewing VPN configurations (VLESS, TROJAN)
- **Administrative Functions**: managing users, configurations, requests, news
- **XUI Integration**: synchronizing configurations with 3X-UI panel
- **Application Settings Management**: system settings, enabling/disabling registration

### Dependencies

- **PostgreSQL** - main database for storing all data
- **Redis** (main) - caching JWT tokens, sessions
- **Redis** (rate limiter) - separate instance for rate limiting
- **3X-UI** - external service for managing VPN configurations (on separate server)

### Database Interaction

Backend uses SQLAlchemy (asyncpg) for working with PostgreSQL. All operations are performed through the `DbService`, which provides:

- Transactions for atomic operations
- CRUD operations for all models
- Filtering, pagination, sorting
- Connection session management

### Redis Interaction

Backend uses two Redis instances:

1. **Main Redis** (`REDIS_*`):
   - Storing JWT access tokens for fast validation
   - Caching session data
   - Token TTL configured via `ACCESS_TOKEN_REDIS_TTL_SEC` and `REFRESH_TOKEN_REDIS_TTL_SEC`

2. **Redis Rate Limiter** (`RATE_LIMIT_REDIS_*`):
   - Tracking request counts by IP addresses
   - Global rate limiting via middleware `GlobalRateLimitMiddleware`
   - Configurable limits via `DEFAULT_REQUESTS_PER_MINUTE`

### API Endpoints

Backend provides the following endpoint groups:

- `/api/app/v1/*` - public endpoints (health, settings)
- `/api/auth/v1/*` - authentication and account management
- `/api/backend/v1/*` - user endpoints (configurations, news)
- `/api/admin/v1/*` - administrative endpoints (require ADMIN or SUPERUSER role)

For detailed endpoint descriptions, see the [API documentation](api.md). Access rights distribution by endpoints is described in the [Roles documentation](roles.md).

## Frontend Service

### Main Functions

Frontend Service is a React application on TypeScript, built with Vite:

- **User Interface**: pages for registration, login, managing configurations, profile
- **Administrative Panel**: managing users, configurations, requests, news (for ADMIN/SUPERUSER)
- **Telegram Integration**: Telegram WebApp support for authorization via Telegram
- **Multilingual Support**: Russian and English language support (i18n)
- **State Management**: Zustand store for global application state

### Backend API Interaction

Frontend interacts with Backend via HTTP API:

- **API Client** (`services/api/api.ts`): centralized client for all user API requests
- **Admin API Client** (`services/api/admin.ts`): separate client for administrative operations
- **Persistent Session**: refresh token stored in localStorage (persistently), access token in sessionStorage, ensuring session persistence between page reloads
- **Sliding Token Refresh**: client automatically refreshes access token when approaching expiration (check before each request), as well as on receiving 401. On successful refresh, a new token pair (access + refresh) is issued, extending the session and creating a "sliding window" effect - while the user is active, the session does not expire
- **Error Handling**: centralized handling of authorization and validation errors
- **Typing**: full typing of all requests and responses via TypeScript

### State Management

Frontend uses Zustand for global state management:

- **useAppStore**: stores information about current user, tokens, settings
- **Automatic Synchronization**: state synchronizes with tokens in localStorage
- **Reactivity**: components automatically update on state changes

### Routing

Routing is implemented via React Router:

- Public routes: `/`, `/login`, `/register`
- Protected routes: `/configs`, `/account` (require authentication)
- Administrative routes: `/admin/*` (require ADMIN or SUPERUSER role)
- Route protection via `ProtectedRoute` component

For more information on roles and access rights, see the [Roles documentation](roles.md).

## Notificator Service

### Main Functions

Notificator Service is a background Python service that periodically checks and sends notifications:

- **Checking Expiring Configurations**: automatically creating notifications for configurations that will expire soon
- **Sending Notifications**: sending notifications via Telegram and other social networks
- **Cleaning Up Old Notifications**: automatically removing notifications older than specified period

### Notification Processing

The service works in a loop with configurable interval (`PROCESS_PERIOD_SEC`): checking expiring configurations, retrieving unread notifications from database, sending notifications through appropriate channels, retrying failed notifications, and cleaning up old notifications.

### Checking Expiring Configurations

The service checks configurations expiring within the specified period (`CONFIG_EXPIRY_NOTIF_HOURS`):

- Finds configurations with `valid_to_dttm` in the next N hours
- Checks that no notification has been created for the configuration yet
- Creates notifications with multilingual content (Russian/English)
- Saves notifications to database with `new` status

### Sending Notifications

The service sends notifications through various channels:

- **Telegram**: sending via Telegram Bot API with button to open Web App
- **Yandex**: support for sending via Yandex (if implemented)
- Multilingual: notifications are sent in user's language (from `profile.lang_code`)

After successful sending, the notification is updated with sending channel and time.

### Error Handling

- Failed sends are logged and retried in the next iteration
- Database connection errors are handled with logging
- Graceful shutdown on receiving SIGINT/SIGTERM

### Database Interaction

Notificator uses asyncpg for direct connection to PostgreSQL:

- Reading notifications from `notification` table
- Reading configurations from `config` table
- Reading user profiles to determine language
- Updating notification sending status

### Telegram Bot Interaction

Notificator uses aiogram to send messages via Telegram Bot:

- Sending text messages with buttons
- Integration with Web App via `WebAppInfo`
- Handling sending errors (user blocked bot, etc.)

## Telegram Bot Service

### Main Functions

Telegram Bot Service is a simple Telegram bot on aiogram providing an entry point to the web application:

- **/start Command**: welcome message with button to open Web App
- **Web App Integration**: button opens web application in Telegram
- **Multilingual Support**: automatic user language detection (Russian/English)

### Bot Commands

- `/start` - main command, sends welcome message with button to open Web App

### Web App Integration

The bot uses Telegram Web App API:

- Button with `WebAppInfo` points to web application URL (`WEB_APP_URL`)
- On button click, Telegram opens web application in embedded browser
- Web application can use Telegram WebApp API to get user data

### Frontend Interaction

The bot does not interact directly with Frontend, but provides an entry point:

1. User clicks `/start` in bot
2. Bot sends message with Web App button
3. User clicks button, web application opens
4. Frontend uses Telegram WebApp API to get user data
5. Frontend sends data to Backend for authorization via `/api/auth/v1/login/social/telegram`

## Data Exchange Between Services

### HTTP API

Main method of interaction between Frontend and Backend:

- **Protocol**: HTTP/HTTPS
- **Data Format**: JSON
- **Authentication**: JWT tokens in `Authorization: Bearer <token>` header
- **CORS**: configured for allowed domains

### Database

All services use a shared PostgreSQL database:

- **Backend**: main database work through SQLAlchemy
- **Notificator**: direct connection via asyncpg for reading/writing notifications
- **Database Schema**: unified schema for all services, migrations managed by Backend

For detailed information on data models, see the [Data Models documentation](data-models.md).

### Redis

Backend uses Redis for:

- **JWT Token Caching**: fast access token validation without database access (see [Authentication documentation](authentication.md) for details)
- **Rate Limiting**: tracking request counts by IP
- **Token TTL**: automatic token expiration via Redis TTL

Notificator and Telegram Bot do not use Redis directly.

### Message Queues

In the current implementation, message queues are not used. Notificator works in a loop and checks the database directly.

## Interaction Schemes

For detailed information on authentication processes and token handling, see the [Authentication documentation](authentication.md).

### User Registration and Login

1. **Regular Registration**:
   - Frontend → Backend: `POST /api/auth/v1/register`
   - Backend creates user, profile, USER role
   - Backend → Frontend: JWT tokens (access + refresh)

2. **Telegram Login**:
   - User clicks `/start` in Telegram Bot
   - Bot sends Web App button
   - Frontend gets data via Telegram WebApp API
   - Frontend → Backend: `POST /api/auth/v1/login/social/telegram`
   - Backend verifies hash, creates/finds user
   - Backend → Frontend: JWT tokens

3. **Login with Username/Password**:
   - Frontend → Backend: `POST /api/auth/v1/login`
   - Backend verifies password, creates session
   - Backend → Frontend: JWT tokens

### Configuration Creation

1. User creates configuration through Backend API
2. Backend synchronizes configuration with 3X-UI
3. Backend saves configuration to DB
4. User sees configuration through Frontend

### Sending Notifications

1. **Notification Creation**:
   - Backend creates notification in DB (e.g., when creating a request)
   - Notificator periodically checks for new notifications

2. **Checking Expiring Configurations**:
   - Notificator checks configurations that will expire soon
   - Creates notifications for users

3. **Sending**:
   - Notificator retrieves notifications from DB
   - Sends via Telegram Bot API
   - Updates sending status in DB

### Session Management

For detailed information on working with sessions and tokens, see the [Authentication documentation](authentication.md).

1. **Session Creation**:
   - On login, Backend creates session in DB
   - Saves access token in Redis with TTL
   - Returns tokens to Frontend

2. **Token Validation**:
   - Frontend sends request with access token
   - Backend checks token in Redis (fast)
   - If token not in Redis, checks in DB

3. **Token Refresh**:
   - Frontend sends refresh token
   - Backend verifies refresh token in DB
   - Creates new session and tokens

4. **Session Termination**:
   - Backend removes token from Redis
   - Marks session as inactive in DB

## Error Handling

### Error Types

All services use standardized HTTP status codes:

- **400 Bad Request**: data validation errors
- **401 Unauthorized**: missing or invalid token
- **403 Forbidden**: insufficient access rights
- **404 Not Found**: resource not found
- **409 Conflict**: data conflict (e.g., user already exists)
- **422 Unprocessable Entity**: business logic errors
- **500 Internal Server Error**: internal server errors

Backend uses custom exceptions (`src/core/exceptions.py`) for uniform error handling. For detailed information on error types and their codes, see the [API documentation](api.md).

### Logging

All services use structured logging:

- **Backend**: Python logging with configurable level (DEBUG/INFO/ERROR)
- **Notificator**: Python logging with detailed operation logging
- **Telegram Bot**: Python logging for commands and errors
- **Frontend**: console.log for development (external service can be used in production)

### Monitoring

- **Health Check**: Backend provides `/api/app/v1/health` for status check
- **Status Endpoint**: `/api/app/v1/status` shows status of all dependencies (DB, Redis, XUI)
- **Logs**: all services log important events and errors

