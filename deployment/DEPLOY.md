# Production Deployment Guide

## Prerequisites

- VPS with Ubuntu/Debian
- Domain `spotitools.com` and `www.spotitools.com` pointed to VPS IP
- Docker and Docker Compose installed
- System nginx installed and running

## Architecture

- **System Nginx**: Handles SSL termination and reverse proxy (port 443 → 8080)
- **Docker Container**: Runs Node.js server + nginx on internal port 8080
- **Domain**: `www.spotitools.com` (primary), `spotitools.com` redirects to www

## Step 1: Install Certbot

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

## Step 2: Obtain SSL Certificate

Since you have a wildcard cert for `*.spotitools.com`, you'll need to use DNS challenge:

```bash
sudo certbot certonly --manual --preferred-challenges dns -d '*.spotitools.com'
```

Follow the prompts to add the TXT record to your DNS provider.

**Note**: Wildcard cert covers `www.spotitools.com` but NOT the apex `spotitools.com`. 
We handle apex via HTTP redirect (no SSL needed on apex).

## Step 3: Configure System Nginx

Copy the nginx configuration:

```bash
sudo cp deployment/nginx-system.conf /etc/nginx/sites-available/spotitools.com
sudo ln -s /etc/nginx/sites-available/spotitools.com /etc/nginx/sites-enabled/
```

Test and reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 4: Update Spotify Developer Dashboard

Add the redirect URI to your Spotify app:

```
https://www.spotitools.com/callback
```

## Step 5: Update Environment Variables

Ensure `.env` has:

```env
REDIRECT_URI=https://www.spotitools.com/callback
PORT=3001
```

## Step 6: Build and Start Docker Containers

```bash
docker compose down  # Stop any existing containers
docker compose up --build -d
```

Check logs:

```bash
docker compose logs -f
```

## Step 7: Test

### Local Testing (Before DNS Change)

Add to your local `/etc/hosts`:

```
YOUR_VPS_IP www.spotitools.com
YOUR_VPS_IP spotitools.com
```

Then visit:
- https://www.spotitools.com (should work)
- http://spotitools.com (should redirect to https://www)

### After DNS is Updated

Simply visit:
- https://www.spotitools.com
- http://spotitools.com (redirects to https://www)
- http://www.spotitools.com (redirects to https://www)

## Troubleshooting

### Check Docker containers
```bash
docker compose ps
docker compose logs -f
```

### Check nginx config
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Check SSL certificate
```bash
sudo certbot certificates
```

### Check if port 8080 is accessible
```bash
curl http://127.0.0.1:8080
```

### View nginx access logs
```bash
sudo tail -f /var/log/nginx/access.log
```

## Maintenance

### Renew SSL Certificate

Let's Encrypt certs expire every 90 days. Renew with:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

Set up auto-renewal:

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Update Application

```bash
git pull origin master
docker compose up --build -d
```
