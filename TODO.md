# TODO.md - Spotitools

## Overview

Modernize and stabilize spotitools.com. Currently deployed on EC2 with issues (disk fills up, site not showing properly). Moving toward Docker + nginx for production stability.

---

## 🔴 High Priority (Stability)

### Deployment Overhaul
- [ ] **Diagnose disk space issue** — likely causes:
  - Dev server generating excessive files/logs
  - `node_modules` bloat
  - No log rotation
  - Build artifacts accumulating
- [ ] **Create Dockerfile** for production deployment
  - Multi-stage build (build React, then serve)
  - Minimal production image
- [ ] **Add nginx config** for static file serving
  - Serve React build as static files
  - Reverse proxy API routes to Node backend
  - Proper caching headers
- [ ] **docker-compose.yml** for easy deployment
  - nginx + node services
  - Volume for persistent data
  - Health checks

### Data Persistence
- [ ] **Migrate monthly export subscribers** from `monthlyExportUsers.json`
  - Options: SQLite, PostgreSQL, or Redis
  - Export current users from old EC2 server
  - Implement database adapter
- [ ] **Backup strategy** for subscriber data

---

## 🟡 Medium Priority (Security & Config)

### Environment Variables
- [ ] **Move client_id to env** (currently hardcoded in `server.js`)
- [ ] **Verify client_secret.json approach** — consider moving to env var
- [ ] **Create `.env.example`** documenting all required vars
- [ ] **Update redirect_uri handling** — configurable per environment

### Cookie Security
- [ ] **Add `httpOnly` flag** to sensitive cookies (refreshToken)
- [ ] **Add `secure` flag** for production (HTTPS only)
- [ ] **Consider SameSite attribute** for CSRF protection

---

## 🟢 Lower Priority (Modernization)

### Dependency Updates
- [ ] **React 16 → 18** (check for breaking changes)
- [ ] **react-router-dom 5 → 6** (significant API changes)
- [ ] **Replace `request` library** — deprecated, use `fetch` or `axios`
- [ ] **node-sass → sass** (Dart Sass, better maintained)
- [ ] **Audit other deps** for security vulnerabilities (`npm audit`)

### Code Quality
- [ ] **Tighten TypeScript types** — reduce `any` usage
- [ ] **Add error boundaries** in React
- [ ] **Improve API error handling** — user-friendly messages
- [ ] **Add basic tests** — at least for SpotifyService

### Features (Future)
- [ ] Dark mode / theme toggle
- [ ] Better mobile responsiveness
- [ ] Export playlist to other formats (CSV, etc.)

---

## 📋 Migration Checklist

When ready to deploy new version:

1. [ ] Export `monthlyExportUsers.json` from current EC2
2. [ ] Set up new persistence (DB)
3. [ ] Import subscriber data
4. [ ] Build Docker images
5. [ ] Test locally with docker-compose
6. [ ] Deploy to EC2 (or consider alternatives: Railway, Fly.io, etc.)
7. [ ] Update DNS if needed
8. [ ] Monitor disk usage
9. [ ] Decommission old deployment

---

## Notes

- Current production: EC2 at spotitools.com
- Spotify App Client ID: `a1b90597cc8449c89089422a31b8bfa1`
- Redirect URIs configured in Spotify Dashboard need updating if domain changes

---

*Last updated: 2026-02-03*
