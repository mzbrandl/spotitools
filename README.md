# Spotitools

[Spotitools](https://www.spotitools.com) is a web app using the Spotify API. It provides additional functionality, like combining playlists or checking which playlists contain a song and more.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- A [Spotify Developer](https://developer.spotify.com/dashboard) app

## Getting Started

### 1. Create a Spotify App

Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app.

Add the redirect URIs you need. Spotify requires HTTPS for all redirect URIs **except** loopback IPs (`127.0.0.1`), where HTTP is allowed but the port must be explicit. `localhost` is not permitted.

| Environment | Redirect URI |
|---|---|
| Local development | `http://127.0.0.1:3000/callback` |
| Docker dev | `http://127.0.0.1:3000/callback` |
| Docker prod (local) | `http://127.0.0.1:80/callback` |
| Production | `https://yourdomain.com/callback` |

### 2. Configure environment variables

Copy the example and fill in your Spotify credentials:

```bash
cp .env.example .env
```

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

`REDIRECT_URI` can be left unset — the server auto-derives it from the incoming request. Set it explicitly only for production deployments with a custom domain.

### 3. Install dependencies

```bash
npm install
npm run client-install
```

### 4. Run

**Local development** (recommended):

```bash
npm run dev
```

This starts the Express server (port 3001) and CRA dev server (port 3000) with hot reload.
Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

**Docker development**:

```bash
npm run dev:docker
```

Same as above but running inside Docker containers. Tear down with `npm run dev:docker:down`.
Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

**Production (Docker)**:

```bash
docker compose up --build
```

Runs the Express server behind Nginx. Open [http://127.0.0.1](http://127.0.0.1).

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start server + client locally with hot reload |
| `npm run dev:docker` | Start dev environment in Docker |
| `npm run dev:docker:down` | Tear down Docker dev environment |
| `npm start` | Start the production server |
| `npm run build` | Install client deps and build for production |
