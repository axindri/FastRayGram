# Nginx Server Setup

## Prerequisites
- Nginx installed
- Docker containers running (backend on 8080, frontend on 3000)
- Domain name configured (replace `your-domain.com` with your domain)
- SSL certificates (Let's Encrypt recommended)

## Setup Steps

### 1. Configure Nginx

Copy nginx configuration (from project root):
```bash
sudo cp ../nginx/fast-ray-gram-with-blocks /etc/nginx/sites-available/fast-ray-gram
```

Replace `your-domain.com` with your actual domain:
```bash
sudo sed -i 's/your-domain.com/your-actual-domain.com/g' /etc/nginx/sites-available/fast-ray-gram
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/fast-ray-gram /etc/nginx/sites-enabled/
```

Test configuration:
```bash
sudo nginx -t
```

Reload nginx:
```bash
sudo systemctl reload nginx
```

### 2. Setup SSL with Let's Encrypt

Install certbot:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

Obtain certificate (replace with your domain):
```bash
sudo certbot --nginx -d your-actual-domain.com
```

Note: Nginx must be running and accessible on port 80 for certbot to work.

Certbot will automatically update nginx configuration.

### 3. Configure Firewall (UFW)

Run firewall setup script (from project root):
```bash
chmod +x ../ufw/ports-bloks.sh
sudo ../ufw/ports-bloks.sh
```

This will:
- Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 5555 (PostgreSQL)
- Restrict ports 3000 and 8080 to localhost only
- Block external access to ports 3000 and 8080

### 4. Verify Configuration

Check listening ports:
```bash
sudo netstat -tlnp | grep -E ':(80|443|3000|8080|5555)'
```

Expected:
- `0.0.0.0:80` - HTTP
- `0.0.0.0:443` - HTTPS
- `127.0.0.1:3000` - Frontend (localhost only)
- `127.0.0.1:8080` - Backend (localhost only)
- `0.0.0.0:5555` - PostgreSQL (if configured)

Test external access (replace with your domain):
```bash
curl https://your-actual-domain.com
curl https://your-actual-domain.com/api/app/health
```

Test blocked ports (should fail):
```bash
curl http://your-server-ip:3000
curl http://your-server-ip:8080
```

## Rollback

To revert firewall changes:
```bash
sudo ufw status numbered
sudo ufw delete <rule_number>
# Or reset all:
sudo ufw reset
sudo ufw disable
```

## Notes

- Replace `your-domain.com` with your actual domain in nginx config and certbot command
- Ports 3000 and 8080 are only accessible from localhost
- Port 5555 (PostgreSQL) is accessible externally - ensure strong password
- All API endpoints are accessible via `/api/*` prefix through nginx
- Ensure docker-compose.yml has ports bound to 127.0.0.1 for frontend and backend
