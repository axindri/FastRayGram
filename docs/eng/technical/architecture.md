# System Architecture

## System Overview

Fast Ray Gram is a distributed system for managing configurations, built on a microservices architecture. The system consists of four main services running in Docker containers and uses a shared PostgreSQL database and Redis for caching and rate limiting.

The system architecture follows the principles of separation of concerns: each service performs its specific function and interacts with others through well-defined interfaces (HTTP API, database).

For detailed information on service interactions, see the [Services documentation](services.md).

## System Components

### Backend API

FastAPI application providing REST API for all system operations. It is the central component handling business logic, authentication, authorization, and data management.

**Main functions:**
- REST API for managing users, configurations, sessions
- JWT-based authentication and authorization
- Integration with 3X-UI for synchronizing VPN configurations
- Administrative functions for system management

**Technologies:** FastAPI, SQLAlchemy, asyncpg, Redis, JWT

For detailed information, see the [Services documentation](services.md#backend-api-service). API endpoints are described in the [API documentation](api.md). Authentication and authorization are described in the [Authentication documentation](authentication.md).

### Frontend

React application on TypeScript providing the user interface. Built into static files and served through Nginx.

**Main functions:**
- User interface for managing configurations
- Administrative panel for system management
- Integration with Telegram WebApp for authorization via Telegram
- Multilingual support (Russian/English)

**Technologies:** React, TypeScript, Vite, Zustand, React Router

For detailed information, see the [Services documentation](services.md#frontend-service).

### Notificator Service

Background Python service running in a loop and processing notifications for users.

**Main functions:**
- Checking expiring configurations and creating notifications
- Sending notifications via Telegram and other channels
- Cleaning up old notifications

**Technologies:** Python, asyncpg, aiogram

For detailed information, see the [Services documentation](services.md#notificator-service).

### Telegram Bot

Simple Telegram bot on aiogram providing an entry point to the web application via Telegram WebApp.

**Main functions:**
- `/start` command to open the web application
- Integration with Telegram WebApp API

**Technologies:** Python, aiogram

For detailed information, see the [Services documentation](services.md#telegram-bot-service).

## Infrastructure

### Database (PostgreSQL)

PostgreSQL is used as the primary data storage for all services. All services work with a unified database schema.

**Usage:**
- **Backend**: main database work through SQLAlchemy ORM
- **Notificator**: direct connection via asyncpg for reading/writing notifications

**Data models:**
- Users and profiles (`user`, `role`, `profile`, `social`)
- Sessions and tokens (`session`, `refresh`)
- VPN configurations (`config`)
- Notifications (`notification`)
- Requests (`request`)
- News (`news`)
- Application settings (`app_settings`)

For detailed information on data models, see the [Data Models documentation](data-models.md). Database interaction is described in the [Services documentation](services.md#база-данных).

### Redis

The system uses two Redis instances for different purposes:

1. **Main Redis** - caching JWT tokens and session data for fast validation
2. **Redis Rate Limiter** - tracking request counts by IP addresses for rate limiting

For detailed information on Redis usage, see the [Services documentation](services.md#взаимодействие-с-redis) and [Authentication documentation](authentication.md).

### Docker and Docker Compose

All services are deployed in Docker containers and managed through Docker Compose. This ensures service isolation, ease of deployment, and scalability.

**Structure:**
- Each service has its own Dockerfile
- Shared network `frg-network` for inter-container communication
- Shared volumes for persistent data (`/volumes`)
- Single `.env` file for configuring all services

For detailed deployment information, see the [User Guide](../userguide.md).

## Component Interaction Scheme

The system uses several methods of interaction between components:

1. **HTTP API** - main method of interaction between Frontend and Backend
2. **Database** - shared data storage for Backend and Notificator
3. **Redis** - caching and rate limiting for Backend
4. **Telegram Bot API** - sending notifications via Notificator

**Main flows:**
- User → Frontend → Backend → PostgreSQL/Redis
- Backend → 3X-UI (external service) for configuration synchronization
- Notificator → PostgreSQL (reading notifications) → Telegram Bot API (sending)
- Telegram Bot → Frontend (via WebApp)

Detailed interaction schemes are described in the [Services documentation](services.md#схемы-взаимодействия).

## Data Flows

### Authentication and Authorization

1. User registers/logs in through Frontend
2. Frontend sends request to Backend API
3. Backend creates JWT tokens and saves them in Redis and DB
4. Frontend saves tokens and uses them for subsequent requests
5. Backend validates tokens through Redis (fast) or DB

For detailed information on authentication flows, see the [Authentication documentation](authentication.md).

### Configuration Management

1. User creates configuration through Backend API
2. Backend synchronizes configuration with 3X-UI
3. Backend saves configuration to DB
4. User sees configuration through Frontend
5. Notificator periodically checks expiring configurations and creates notifications

### Sending Notifications

1. Backend creates notification in DB (e.g., when creating a request)
2. Notificator periodically checks for new notifications
3. Notificator sends notification via Telegram Bot API
4. Notificator updates sending status in DB

For detailed information on data flows, see the [Services documentation](services.md#схемы-взаимодействия). API endpoints are described in the [API documentation](api.md).

