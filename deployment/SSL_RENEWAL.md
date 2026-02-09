# SSL Certificate Auto-Renewal Setup

## Current Situation

Your Let's Encrypt wildcard certificate (`*.spotitools.com`) was obtained via DNS challenge.
This requires manual DNS record updates, so it cannot auto-renew automatically.

## Option 1: Manual Renewal (Every 90 Days)

Set up a calendar reminder for **May 1, 2026** (9 days before expiry) and run:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

You'll need to update the DNS TXT record again when prompted.

---

## Option 2: Automated Renewal with DNS API (Recommended)

If your DNS provider supports API access, you can automate renewals completely.

### Supported DNS Providers

Certbot has plugins for many DNS providers:
- Cloudflare (`python3-certbot-dns-cloudflare`)
- DigitalOcean (`python3-certbot-dns-digitalocean`)
- Route53 (`python3-certbot-dns-route53`)
- Google Cloud DNS (`python3-certbot-dns-google`)
- And many more

**Who is your DNS provider?**

### Example: Cloudflare Setup

If you use Cloudflare:

1. **Install Cloudflare plugin:**
```bash
sudo apt install python3-certbot-dns-cloudflare
```

2. **Create API token file:**
```bash
sudo mkdir -p /root/.secrets/certbot
sudo nano /root/.secrets/certbot/cloudflare.ini
```

Add:
```ini
dns_cloudflare_api_token = YOUR_API_TOKEN
```

Set permissions:
```bash
sudo chmod 600 /root/.secrets/certbot/cloudflare.ini
```

3. **Obtain certificate with auto-renewal:**
```bash
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /root/.secrets/certbot/cloudflare.ini \
  -d '*.spotitools.com'
```

4. **Set up auto-renewal:**
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

5. **Test renewal:**
```bash
sudo certbot renew --dry-run
```

---

## Option 3: Non-Wildcard Certificate (Easiest)

Since you only need `www.spotitools.com`, you could skip the wildcard entirely:

```bash
# Delete current cert
sudo certbot delete --cert-name spotitools.com

# Obtain non-wildcard cert with automatic renewal
sudo certbot certonly --nginx -d www.spotitools.com
```

This uses nginx plugin and can auto-renew without any manual intervention.

**Pros:**
- Fully automatic renewal
- No DNS challenges needed
- Certbot timer handles everything

**Cons:**
- Only covers www.spotitools.com (not the wildcard)
- If you need additional subdomains later, you'd need to re-request

---

## Recommendation

**If you only need www.spotitools.com:** Use Option 3 (non-wildcard with nginx plugin)

**If you need multiple subdomains:** Use Option 2 (DNS plugin) if your provider supports it

**If neither works:** Use Option 1 (manual renewal reminder)

---

## Current Certificate Info

```bash
# View certificate details
sudo certbot certificates

# Certificate location:
# /etc/letsencrypt/live/spotitools.com/fullchain.pem
# /etc/letsencrypt/live/spotitools.com/privkey.pem

# Expires: May 10, 2026
```
