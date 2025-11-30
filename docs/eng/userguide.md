# Fast Ray Gram User Guide

> 📖 **Technical Documentation:** For a more detailed study of the project's operation, you can refer to the [technical documentation](./technical/README.md).

---

This guide describes the process of deploying Fast Ray Gram on a single server using a shared `docker-compose.yml` file. The system consists of the following components:

- **Backend API** (FastAPI) - main API server
- **Frontend** (React) - web interface
- **Notificator** - notification service
- **Telegram Bot** - Telegram bot for integration
- **PostgreSQL** - database
- **Redis** - cache and token storage (2 instances)

**Important:** 3X-UI v2.8.5 must be installed and configured on a separate server. Integration with 3X-UI is done through API.

**⚠️ CRITICAL 3X-UI Requirements:**
- **Fail2Ban must be enabled** - required for security and IP blocking
- **IP limiting logs must be enabled** - required for traffic monitoring and user management
- **VLESS inbound with remark='vless' must be configured** - required for automatic user addition. The system will add new users to this inbound using the remark field

> **💡 Note:** If you need to distribute services across multiple servers, use separate `docker-compose.yml` files located in each service's folder (`backend/`, `frontend/`, `notificator/`, `tg_bot/`). In this case, you will need to configure network connections between servers and update environment variables to specify remote service addresses.

### Requirements

#### System Requirements

- **OS:** Ubuntu 22.04 LTS
- **RAM:** minimum 2GB (recommended 4GB+)
- **Disk:** minimum 20GB free space
- **CPU:** 2+ cores

#### Software

- **Docker** version 20.10 or higher
- **Docker Compose** version 2.0 or higher
- **Make** for project management via Makefile
- **Nginx** for request proxying
- **Certbot** for obtaining SSL certificates
- **UFW** (Uncomplicated Firewall) for firewall configuration

#### External Services

- **3X-UI v2.8.5** - must be installed and accessible on a separate server
  - **Fail2Ban must be enabled** - required for security and IP blocking
  - **IP limiting logs must be enabled** - required for traffic monitoring and user management
  - **VLESS inbound with remark='vless' must be configured** - required for automatic user addition. The system will add new users to this inbound using the remark field
- **Domain name** - for accessing the application via HTTPS

#### Additional Services (optional, full mode only)

For additional services (Telegram Bot and Notificator) to work in **full mode**, you need:

- **Telegram Bot Token** - obtain from [@BotFather](https://t.me/BotFather) in Telegram
  - Create a bot via [@BotFather](https://t.me/BotFather)
  - Get the bot token
  - Specify the token in environment variables (see "Environment Variables Configuration" section)
- **Web application URL** - for Telegram bot operation and sending notifications
- **Database access** - Notificator uses the same database as Backend API (configured automatically via shared `.env` file)

> **💡 Note:** In lite mode, Notificator and Telegram Bot services are not started, so these requirements are not mandatory.

### Server Preparation

> **💡 Note:** If you already have a server set up with Docker, Docker Compose, Make, Nginx, and SSL certificate installed, you can skip this section and proceed to [Environment Variables Configuration](#environment-variables-configuration).

#### 1. Obtaining a Domain

Make sure you have a domain name and it points to your server's IP address:

```bash
# Check that the domain points to your server
nslookup your-domain.com
# or
dig your-domain.com
```

#### 2. Installing Make

```bash
# Install Make
sudo apt update
sudo apt install -y make

# Verify installation
make --version
```

#### 3. Installing Docker and Docker Compose

Follow the official Docker documentation for installation on Ubuntu:

- [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Install Docker Compose](https://docs.docker.com/compose/install/)

After installation, verify that Docker and Docker Compose are working:

```bash
docker --version
docker compose version
```

#### 4. Installing Nginx

```bash
sudo apt update
sudo apt install -y nginx

# Check status
sudo systemctl status nginx
```

#### 5. Installing Certbot

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

### Environment Variables Configuration

All services use a single `.env` file in the project root. This simplifies configuration management and avoids variable name conflicts.

1. Copy the example environment file:

```bash
cd /path/to/fast_ray_gram
cp example_env .env
```

2. Edit the `.env` file and fill in **required** variables:

```bash
nano .env
```

#### Required Variables to Fill

**⚠️ IMPORTANT:** The following variables **must** be replaced with real values:

##### Database (required)
- `DB_PASSWORD` - password for PostgreSQL database (use a strong password)

##### Redis (required)
- `REDIS_PASSWORD` - password for main Redis (used for container initialization)
- `REDIS_USER_PASSWORD` - password for Redis user (used by application for connection)
- `RATE_LIMIT_PASSWORD` - password for Redis rate limiter (used for container initialization)
- `RATE_LIMIT_USER_PASSWORD` - password for Redis rate limiter user (used by application)

##### Frontend (required)
- `VITE_API_URL` - your API URL (e.g., `https://your-domain.com/api`)

##### Notificator (required. Optional for light mode)
- `TELEGRAM_WEB_APP_URL` - your web application URL (e.g., `https://your-domain.com`)

##### Telegram Bot (required. Optional for light mode)
- `BOT_TOKEN` - Telegram bot token (obtain from [@BotFather](https://t.me/BotFather))
- `WEB_APP_URL` - your web application URL (e.g., `https://your-domain.com`)

##### Backend API (required)
- `AUTH_JWT_MASTER_KEY` - secret key for JWT tokens (**minimum 32 characters**, use a very long random key)
- `APP_ALLOWED_DOMAINS` - comma-separated list of allowed domains (e.g., `your-domain.com,www.your-domain.com`)
- `APP_SALT` - salt for hashing (use a random string 32+ characters long)
- `APP_SUPERUSER_PASSWORD` - superuser password (used for first login)
- `APP_TELEGRAM_BOT_TOKEN` - Telegram bot token (can be the same as `BOT_TOKEN`)

##### 3X-UI Integration (required)
- `XUI_HOST` - IP address or domain of the server with 3X-UI (e.g., `192.168.1.100` or `xui.your-domain.com`)
- `XUI_SECRET_PATH` - 3X-UI secret path (e.g., `/your-secret-path-here`)
- `XUI_USERNAME` - username for accessing 3X-UI
- `XUI_PASSWORD` - password for accessing 3X-UI

#### Variables with Default Values (can be left as is)

The following variables have default values and **do not require** mandatory changes if they suit you:

##### Database (optional)
- `DB_HOST=frg-db` - container name (do not change for Docker)
- `DB_PORT=5432` - PostgreSQL port inside container
- `DB_NAME=frg` - database name
- `DB_USER=frg_db_admin` - database user

##### Redis (optional)
- `REDIS_HOST=frg-redis` - container name (do not change for Docker)
- `REDIS_PORT=6379` - standard Redis port
- `REDIS_DB_NUMBER=0` - Redis database number
- `REDIS_MAX_CONNECTIONS=100` - maximum number of connections
- `REDIS_USER=frg_redis_admin` - Redis username

##### Rate Limiter Redis (optional)
- `RATE_LIMIT_HOST=frg-rate-limiter-redis` - container name (do not change for Docker)
- `RATE_LIMIT_PORT=6379` - standard Redis port
- `RATE_LIMIT_DB_NUMBER=0` - Redis database number
- `RATE_LIMIT_MAX_CONNECTIONS=100` - maximum number of connections
- `RATE_LIMIT_USER=frg_redis_rate_limiter_admin` - Redis username
- `RATE_LIMIT_ENABLED=true` - enable rate limiting
- `RATE_LIMIT_EXCLUDE_IP_ADDRESSES=192.168.65.2,192.168.1.1` - IP addresses excluded from rate limiting
- `RATE_LIMIT_DEFAULT_REQUESTS_PER_MINUTE=60` - default requests per minute limit

##### Frontend (optional)
- `VITE_TELEGRAM_GROUP_URL` - Telegram group link (can be left empty)
- `VITE_TELEGRAM_BOT_URL` - Telegram bot link (if empty, Telegram authentication will be unavailable)

##### Notificator (optional)
- `TELEGRAM_SUPERUSER_ID=0` - superuser ID in Telegram (0 = disabled)
- `APP_CLEANUP_PERIOD_DAYS=2` - period for cleaning old notifications
- `APP_PROCESS_PERIOD_SEC=10` - period for checking new notifications
- `APP_CONFIG_EXPIRY_NOTIF_HOURS=2` - hours before expiry to send notification

##### Authentication (optional)
- `AUTH_ENABLED=true` - enable authentication
- `AUTH_JWT_ALGORITHM=HS256` - JWT signature algorithm
- `AUTH_ACCESS_TOKEN_EXPIRE_SEC=1200` - access token lifetime (20 minutes)
- `AUTH_REFRESH_TOKEN_EXPIRE_SEC=3000` - refresh token lifetime (50 minutes)
- `AUTH_MAX_SESSIONS=3` - maximum number of concurrent sessions

##### Application (optional)
- `APP_SECRET_PATH=/secret_url` - secret path for API documentation
- `APP_SUPERUSER_LOGIN=admin` - superuser login
- `APP_DISABLE_REGISTRATION_STARTUP_PARAM=false` - disable new user registration
- `APP_MAX_LIMIT_IP_STARTUP_PARAM=10` - maximum number of IP addresses per user
- `APP_MAX_TOTAL_GB_STARTUP_PARAM=1000` - maximum traffic in GB
- `APP_BASE_LIMIT_IP=1` - base number of IP addresses for new user
- `APP_BASE_TOTAL_GB=100` - base traffic in GB for new user
- `APP_PROMO_DAYS=7` - number of promo period days
- `APP_EXPIRY_DAYS=30` - configuration validity period in days

##### 3X-UI Integration (optional)
- `XUI_SCHEME=http` - protocol (http or https)
- `XUI_PORT=8080` - 3X-UI API port
- `XUI_SUBSCRIPTION_PORT=2096` - port for subscription links

#### Minimum Configuration Example

Minimum set of required variables for startup:

```bash
# Database - REQUIRED
DB_PASSWORD=your_secure_database_password_here

# Redis - REQUIRED
REDIS_PASSWORD=your_redis_password_here
REDIS_USER_PASSWORD=your_redis_user_password_here
RATE_LIMIT_PASSWORD=your_rate_limit_redis_password_here
RATE_LIMIT_USER_PASSWORD=your_rate_limit_redis_user_password_here

# Frontend - REQUIRED
VITE_API_URL=https://your-domain.com/api

# Notificator - REQUIRED
TELEGRAM_WEB_APP_URL=https://your-domain.com

# Telegram Bot - REQUIRED
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
WEB_APP_URL=https://your-domain.com

# Backend API - REQUIRED
AUTH_JWT_MASTER_KEY=your_very_long_and_secure_jwt_key_min_32_chars_long_at_least
APP_ALLOWED_DOMAINS=your-domain.com,www.your-domain.com
APP_SALT=your_secret_salt_here_random_string_32_chars_minimum
APP_SUPERUSER_PASSWORD=your_superuser_password_here
APP_TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# 3X-UI Integration - REQUIRED
XUI_HOST=192.168.1.100
XUI_SECRET_PATH=/your-secret-path-here
XUI_USERNAME=admin
XUI_PASSWORD=your_xui_password_here
```

⚠️ **Security Recommendations:**
- Use **unique strong passwords** for each variable
- `AUTH_JWT_MASTER_KEY` should be **minimum 32 characters**, preferably 64+ characters
- `APP_SALT` should be a random string 32+ characters long
- Do not use the same passwords for different services
- Keep the `.env` file secure and do not commit it to git (it's already in `.gitignore`)

## Server Deployment

## Nginx Configuration

### Installing Nginx

See section "Quick Start" → "Server Preparation" → "Installing Nginx".

### Nginx Configuration for Fast Ray Gram

1. Copy the configuration file from the project:

```bash
sudo cp /path/to/project/nginx/fast-ray-gram-with-blocks /etc/nginx/sites-available/fast-ray-gram
```

2. Edit the file, replacing `your-domain.com` with your domain:

```bash
sudo nano /etc/nginx/sites-available/fast-ray-gram
```

Replace all occurrences of `your-domain.com` with your real domain.

3. Add rate limiting zone to the main Nginx configuration file:

```bash
sudo nano /etc/nginx/nginx.conf
```

In the `http` block, add (if not already added):

```nginx
limit_req_zone $binary_remote_addr zone=ddos_protection:10m rate=100r/s;
```

4. Activate the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/fast-ray-gram /etc/nginx/sites-enabled/
```

5. Check the configuration:

```bash
sudo nginx -t
```

If the check is successful, reload Nginx:

```bash
sudo systemctl reload nginx
```

### SSL Certificate Configuration (Let's Encrypt)

**Important:** Before obtaining an SSL certificate, make sure:
- Domain points to your server's IP address
- Ports 80 and 443 are open in the firewall
- Nginx is running and accessible on port 80

1. Obtain SSL certificate:

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will automatically:
- Obtain certificate from Let's Encrypt
- Update Nginx configuration to use HTTPS
- Configure automatic certificate renewal

2. Check automatic renewal:

```bash
sudo certbot renew --dry-run
```

### Firewall Configuration (UFW)

1. Run the firewall configuration script:

```bash
cd /path/to/project/ufw
chmod +x ports-bloks.sh
sudo ./ports-bloks.sh
```

The script will perform the following actions:
- Allow SSH (port 22)
- Allow HTTP (port 80)
- Allow HTTPS (port 443)
- Allow PostgreSQL (port 5555) - only for external access if necessary
- Allow access to ports 3000 and 8080 only from localhost
- Block external access to ports 3000 and 8080
- Enable UFW

2. Check firewall status:

```bash
sudo ufw status verbose
```

Expected result:
- Ports 22, 80, 443, 5555 open for all
- Ports 3000 and 8080 accessible only from localhost

### Starting the Project

All services are started through Makefile. Make sure the `.env` file is created and filled (see "Environment Variables Configuration" section).

The project supports two operating modes:
- **Full mode (default)** - all services including Notificator and Telegram Bot
- **Lite mode** - only core services (Backend API, Frontend, Database, Redis) without Notificator and Telegram Bot

The commands below are for **full mode** (default). If you need lite mode, see the [Lite mode](#lite-mode) section below.

#### Main Commands

**Start:**
```bash
make up
```

This command:
- Will build images for all services (if necessary)
- Will start all containers in background mode
- Will create a common network for service interaction
- Will configure dependencies between services

**Check status:**
```bash
make ps
```

All services should be in `Up` status:
- `database` - PostgreSQL
- `redis` - main Redis
- `redis-rate-limiter` - Redis for rate limiting
- `api` - Backend API
- `website` - Frontend
- `notificator` - notification service
- `tg-bot` - Telegram bot

**Stop:**
```bash
make down
```

**Restart:**
```bash
make restart
```

**Complete removal (including volumes):**
```bash
make destroy
```

**Update project:**
```bash
make update        # Update with rebuild (preserves data)
make update-hard   # Update with full rebuild (removes all data)
```

#### View Logs

```bash
make logs              # Logs of all services
make logs-api          # Backend API logs
make logs-website      # Frontend logs
make logs-notificator  # Notificator logs
make logs-tg-bot       # Telegram Bot logs
```

#### Additional Commands

```bash
make build    # Build images without starting
make rebuild  # Rebuild and restart all services
make help     # Show help for all commands
```

#### Lite mode

Lite mode runs only core services (Backend API, Frontend, Database, Redis) without Notificator and Telegram Bot.

To run in lite mode, add the `mode=lite` parameter to any command:

```bash
# Start in lite mode
make up mode=lite

# Stop in lite mode
make down mode=lite

# View logs in lite mode
make logs mode=lite

# Update in lite mode
make update mode=lite
```

**Note:** In lite mode, `make logs-notificator` and `make logs-tg-bot` commands are unavailable, as these services are not started.

**Usage examples:**

```bash
# Start project
make up

# View logs
make logs

# Stop
make down

# Complete removal (including data)
make destroy

# Update project from git (preserves data)
make update

# Update project from git with full rebuild (removes all data)
make update-hard

# Start in lite mode (without Notificator and Telegram Bot)
make up mode=lite

# Update in lite mode
make update mode=lite
```

**⚠️ Warning:** The `make destroy` command removes all data (database, Redis), including the `volumes/` folder. Use it only if you are sure you want to delete all data.

**⚠️ Warning:** The `make update-hard` command performs `destroy` before updating, which will result in loss of all data. Use it for a complete project update with a clean installation.

### Summary: Starting the Project

To start the project, run one of the following commands:

```bash
# Full mode (all services)
make up

# Lite mode (without Notificator and Telegram Bot)
make up mode=lite
```

### Configuration Verification and Initial Setup

1. Check that all services are running:

```bash
# Check Docker containers
make ps

# Check Nginx
sudo systemctl status nginx

# Check ports
sudo netstat -tlnp | grep -E ':(80|443|3000|8080|5555)'
```

2. Wait for full Backend API initialization (usually 10-30 seconds). Check logs:

```bash
docker compose logs api | grep -i "started\|ready\|error"
```

The system will automatically create:
- Roles (SUPERUSER, ADMIN, USER)
- Superuser with login and password from `APP_SUPERUSER_LOGIN` and `APP_SUPERUSER_PASSWORD`
- Basic application settings

3. Check accessibility via browser:

- Open `https://your-domain.com` - frontend should open
- Open `https://your-domain.com/api/app/health` - API status should be returned

4. Log in using superuser credentials:
   - Login: value from `APP_SUPERUSER_LOGIN` (default `admin`)
   - Password: value from `APP_SUPERUSER_PASSWORD` (the one you specified in `.env`)

5. Check that ports 3000 and 8080 are not accessible from outside:

```bash
# From another server try to connect (should fail)
curl http://your-server-ip:3000
curl http://your-server-ip:8080
```

## Maintenance

### Project Update

To update the project, use the `make update` command:

```bash
make update
```

This command:
1. Executes `git pull` to get the latest changes
2. Rebuilds and restarts all services
3. **Preserves all data** (database, Redis)

**For full update with removal of all data:**

```bash
make update-hard
```

This command:
1. Executes `git pull` to get the latest changes
2. Executes `make destroy` to completely remove containers and volumes
3. Rebuilds and starts all services from scratch

**⚠️ Warning:** The `make update-hard` command removes all data (database, Redis). Use it only if you are ready to lose all data or have a backup.

**Recommendations:**
- Use `make update` for regular updates (preserves data)
- Use `make update-hard` only if:
  - There are critical changes in the database schema
  - A clean installation is needed
  - You have a data backup

### Log Monitoring

#### Docker Container Logs

To view logs, use Makefile commands:

```bash
# Logs of all containers in real time
make logs

# Logs of specific service in real time
make logs-api          # Backend API
make logs-website      # Frontend
make logs-notificator  # Notificator
make logs-tg-bot       # Telegram Bot
```

All commands show logs in real time (follow new entries). Press `Ctrl+C` to exit.

#### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/fast_ray_gram_access.log

# Error logs
sudo tail -f /var/log/nginx/fast_ray_gram_error.log
```
