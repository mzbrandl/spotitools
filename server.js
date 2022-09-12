/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

const express = require("express"); // Express web server framework
const request = require("request"); // "Request" library
const cors = require("cors");
const querystring = require("querystring");
const cookieParser = require("cookie-parser");
const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const schedule = require('node-schedule');

const client_id = "a1b90597cc8449c89089422a31b8bfa1"; // Your client id
const client_secret = require("./client_secret.json"); // Your secret
const redirect_uri = "https://www.spotitools.com/callback/"; // Your redirect uri

const PORT = process.env.PORT || 8080;

const MONTHLY_TOP_SONGS_USERS_FILE = "./monthlyExportUsers.json";

const spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUri: redirect_uri
});

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = function (length) {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const stateKey = "spotify_auth_state";

/**
 * At the start of the month generate a playlist of users top songs from the previous month.
 */
const monthlyTopSongsJob = schedule.scheduleJob('0 0 1 * *', function () {
  if (fs.existsSync(MONTHLY_TOP_SONGS_USERS_FILE)) {
    const rawData = fs.readFileSync(MONTHLY_TOP_SONGS_USERS_FILE);
    const users = JSON.parse(rawData);
    const formatter = new Intl.DateTimeFormat('en', { month: 'long' });
    const yearFormatter = new Intl.DateTimeFormat('en', { year: 'numeric' });
    let monthString = formatter.format(new Date().setMonth(new Date().getMonth() - 1));
    let yearString = yearFormatter.format(new Date());
    for (const user of users) {
      const authOptions = {
        url: "https://accounts.spotify.com/api/token",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(client_id + ":" + client_secret).toString("base64"),
        },
        form: {
          grant_type: "refresh_token",
          refresh_token: user.refreshToken,
        },
        json: true,
      };
      request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          const accessToken = body.access_token;
          spotifyApi.resetRefreshToken();
          spotifyApi.resetAccessToken();
          spotifyApi.setRefreshToken(user.refreshToken);
          spotifyApi.setAccessToken(accessToken);
          spotifyApi.getMyTopTracks({ limit: 50, offset: 0, time_range: "short_term" }).then(
            data => {
              const topTracks = data.body.items;
              spotifyApi.createPlaylist(`Your Top Songs ${monthString} ${yearString}`, { description: "Generated with spotitools.com" }).then(
                playlistRes => spotifyApi.addTracksToPlaylist(playlistRes.body.id, topTracks.map(track => track.uri)))
            },
            err => console.log(err))
        }
      });
    }
  }
});

const app = express();

app
  .use(express.static(__dirname + "/client/build"))
  .use(cors())
  .use(cookieParser())
  .set('etag', false);

app.get("/login", function (_req, res) {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  const scope = [
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-top-read",
    "user-library-read"
  ].reduce((scope, item) => (scope += `${item} `), "");

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state,
    })
  );
});

app.get("/callback", function (req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
      querystring.stringify({
        error: "state_mismatch",
      })
    );
  } else {
    res.clearCookie(stateKey);
    const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
      },
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        const access_token = body.access_token,
          refresh_token = body.refresh_token;

        const options = {
          url: "https://api.spotify.com/v1/me",
          headers: { Authorization: "Bearer " + access_token },
          json: true,
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (_error, _response, body) {

          res.cookie("userId", body.id)
          res.cookie("accessToken", access_token);
          res.cookie("refreshToken", refresh_token, {
            expires: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
          });

          // we can also pass the token to the browser to make requests from there
          res.redirect("/");
        });
      } else {
        res.redirect(
          "/#" +
          querystring.stringify({
            error: "invalid_token",
          })
        );
      }
    });
  }
});

app.get("/refresh_token", function (req, res) {
  // requesting access token from refresh token
  const refresh_token = req.cookies["refreshToken"];
  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      res.cookie("accessToken", access_token);
      res.redirect("/");
    }
  });
});

app.put("/subscribe_monthly_export", function (req, res) {
  let users = [];
  if (fs.existsSync(MONTHLY_TOP_SONGS_USERS_FILE)) {
    let rawData = fs.readFileSync(MONTHLY_TOP_SONGS_USERS_FILE);
    users = JSON.parse(rawData);
  }
  if (!users.some(item => item.userId === req.cookies["userId"])) {
    users.push({
      "userId": req.cookies["userId"],
      "refreshToken": req.cookies["refreshToken"]
    })
    fs.writeFileSync(MONTHLY_TOP_SONGS_USERS_FILE, JSON.stringify(users));
  }
  res.end()
})

app.put("/unsubscribe_monthly_export", function (req, res) {
  let users = [];
  if (fs.existsSync(MONTHLY_TOP_SONGS_USERS_FILE)) {
    let rawData = fs.readFileSync(MONTHLY_TOP_SONGS_USERS_FILE);
    users = JSON.parse(rawData);
    users = users.filter(item => item.userId !== req.cookies["userId"])
    fs.writeFileSync(MONTHLY_TOP_SONGS_USERS_FILE, JSON.stringify(users));
  }
  res.end()
})

app.get("/monthly_export", function (req, res) {
  res.setHeader("Cache-Control", "no-cache");
  if (fs.existsSync(MONTHLY_TOP_SONGS_USERS_FILE)) {
    let rawData = fs.readFileSync(MONTHLY_TOP_SONGS_USERS_FILE);
    let users = JSON.parse(rawData);
    if (users.some(item => item.userId === req.cookies["userId"])) {
      res.send({ result: true })
    }
  }
  res.send({ result: false })
})

app.use("*", express.static(__dirname + "/client/build"));

console.log("Listening on " + PORT);
app.listen(PORT);
