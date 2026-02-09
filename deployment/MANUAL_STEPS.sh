#!/bin/bash
# Manual deployment steps requiring sudo access
# Run these commands one by one

echo "=== Step 1: Install Certbot ==="
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

echo ""
echo "=== Step 2: Obtain SSL Certificate ==="
echo "This will require you to add a TXT record to your DNS provider."
echo "Follow the prompts carefully."
echo ""
read -p "Press Enter to continue with certificate request..."

sudo certbot certonly --manual --preferred-challenges dns -d '*.spotitools.com'

echo ""
echo "=== Step 3: Install System Nginx Configuration ==="
sudo cp /home/moe/clawd/projects/spotitools/deployment/nginx-system.conf /etc/nginx/sites-available/spotitools.com
sudo ln -s /etc/nginx/sites-available/spotitools.com /etc/nginx/sites-enabled/

echo ""
echo "=== Step 4: Test Nginx Configuration ==="
sudo nginx -t

echo ""
echo "=== Step 5: Reload Nginx ==="
sudo systemctl reload nginx

echo ""
echo "=== Step 6: Build and Start Docker Containers ==="
cd /home/moe/clawd/projects/spotitools
docker compose up --build -d

echo ""
echo "=== Deployment Complete! ==="
echo ""
echo "Next steps:"
echo "1. Update DNS to point spotitools.com and www.spotitools.com to this VPS IP"
echo "2. Test with local hosts file override first (see DEPLOY.md)"
echo "3. Add https://www.spotitools.com/callback to Spotify Developer Dashboard"
echo ""
echo "Check status with:"
echo "  docker compose ps"
echo "  docker compose logs -f"
echo "  sudo systemctl status nginx"
