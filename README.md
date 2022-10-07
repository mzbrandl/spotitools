# Spotitools
[Spotitools](https://www.spotitools.com) is a web app using the Spotify API. It provides additional functionality, like combining playlists or checking which playlists contain a song and more.

## Get Started
To run the site you must create an app in the Spotify developer dashboard: [reference](https://developer.spotify.com/documentation/general/guides/authorization/app-settings/).
Add `http://localhost:3000/callback/` as a redirect uri.
Create a file called `client_secret.json` in the root directory and paste your client secret in it like `"12345678123456781234567812345678"`

For development run
```bash
npm install
npm run client-install
npm run dev
```

For deployment run
```bash
npm install
npm run build
npm run server
```