# AGENTS.md - Spotitools

## What is this?

A web app extending Spotify functionality with features the official apps lack. Built a few years ago, publicly available at [spotitools.com](https://www.spotitools.com).

**Author:** Moritz Brandl  
**Repo:** [github.com/mzbrandl/spotitools](https://github.com/mzbrandl/spotitools)

---

## Architecture

**Monorepo with two parts:**

```
spotitools/
├── server.js          # Express backend (OAuth, API proxy, scheduled jobs)
├── client/            # React frontend (TypeScript, MUI, Jotai state)
│   └── src/
│       ├── App.tsx
│       ├── components/
│       └── services/SpotifyService.ts
├── assets/            # Demo GIFs
└── public/            # Server-side static files
```

- **Backend:** Node.js + Express, handles Spotify OAuth flow and token management
- **Frontend:** React 16 with TypeScript, MUI components, Jotai for state
- **API Wrapper:** `spotify-web-api-js` (client) + `spotify-web-api-node` (server)

---

## Features

| Route | Feature | Description |
|-------|---------|-------------|
| `/check-song` | Check Song | Find which of your playlists contain a specific track |
| `/merge-playlists` | Merge Playlists | Combine multiple playlists into one (deduped) and play shuffled |
| `/top-songs-export` | Top Songs Export | Subscribe to auto-generate monthly "Your Top Songs" playlists |
| `/recently-added` | Recently Added | Chronological view of songs added across all playlists |
| `/like-catalog` | Like Catalog | Shows liked songs not in any playlist |

---

## Key Implementation Details

### OAuth Flow
- Standard Spotify Authorization Code flow
- Tokens stored in cookies (`accessToken`, `refreshToken`, `userId`)
- `/login` → Spotify auth → `/callback` → stores tokens → redirect home
- `/refresh_token` endpoint refreshes access token from refresh token

### Monthly Export Job
- Uses `node-schedule` to run at midnight on 1st of each month
- Subscribers stored in `monthlyExportUsers.json` (gitignored)
- Creates playlist with user's short-term top 50 tracks

### Rate Limiting
- `SpotifyService.ts` handles 429s with `retry-after` header
- Recursive fetching for paginated endpoints (playlists, tracks, likes)

### Track Deduplication
- `isSameTrack()` compares by ID first, then name+artist+duration
- Handles Spotify's regional track variants

---

## Environment & Secrets

**Required:** `client_secret.json` in root — contains Spotify client secret as a JSON string:
```json
"your-spotify-client-secret-here"
```

**Client ID:** Hardcoded in `server.js` as `a1b90597cc8449c89089422a31b8bfa1`

**Redirect URIs:**
- Production: `https://www.spotitools.com/callback/`
- Development: `http://localhost:3000/callback/`

---

## Running Locally

```bash
# Install deps
npm install
npm run client-install

# Dev mode (server on 8080, client on 3000 with proxy)
npm run dev

# Production build
npm run build
npm run start
```

**Ports:**
- Dev client: 3000 (proxies API to 8080)
- Server: 8080 (or `$PORT`)

---

## Tech Stack

**Backend:**
- express, cors, cookie-parser
- spotify-web-api-node
- node-schedule (cron)
- request (legacy HTTP client — consider replacing with fetch/axios)

**Frontend:**
- React 16.14 + TypeScript 4.6
- MUI 5 + Emotion
- Jotai (state management)
- react-router-dom 5
- spotify-web-api-js
- node-sass 7 (SCSS modules)

---

## Potential Updates

The codebase is from ~2022. Things that may need attention:

1. **React version** — Still on React 16, could upgrade to 18
2. **react-router-dom** — v5, could migrate to v6 (breaking changes)
3. **`request` library** — Deprecated, replace with `fetch` or `axios`
4. **node-sass** — Consider migrating to `sass` (Dart Sass)
5. **Security** — Client ID exposed in code; tokens in cookies without `httpOnly`
6. **TypeScript** — Some `any` types could be tightened
7. **Error handling** — Could be more robust in API calls

---

## Current Deployment

- **Live at:** spotitools.com (EC2 instance)
- **Issue:** Disk fills up, site stops displaying properly
- **Likely cause:** Running with Node dev server instead of proper static serving
- **Planned:** Docker + nginx deployment for stability

See `TODO.md` for migration plan and task tracking.

---

## Notes

- Demo GIFs in `/assets/` (large files, ~100MB total)
- `.vscode/settings.json` exists with project-specific config
- No tests currently (`npm test` just echoes error)
- `monthlyExportUsers.json` on old server needs migration to proper DB
