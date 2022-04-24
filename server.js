/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require("express"); // Express web server framework
var request = require("request"); // "Request" library
var cors = require("cors");
var querystring = require("querystring");
var cookieParser = require("cookie-parser");
var SpotifyWebApi = require('spotify-web-api-node');
var fs = require('fs');
const schedule = require('node-schedule');

var client_id = "a1b90597cc8449c89089422a31b8bfa1"; // Your client id
var client_secret = require("./client_secret.json"); // Your secret
var redirect_uri = "https://www.spotitools.com/callback/"; // Your redirect uri

const PORT = process.env.PORT || 8080;

const MONTHLY_TOP_SONGS_USERS_FILE = "./monthlyExportUsers.json";

var spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUri: redirect_uri
});

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = "spotify_auth_state";

/**
 * At the start of the month generate a playlist of users top songs from the previous month.
 */
const monthlyTopSongsJob = schedule.scheduleJob('0 0 1 * *', function () {
  if (fs.existsSync(MONTHLY_TOP_SONGS_USERS_FILE)) {
    const rawdata = fs.readFileSync(MONTHLY_TOP_SONGS_USERS_FILE);
    const users = JSON.parse(rawdata);
    const formatter = new Intl.DateTimeFormat('en', { month: 'long' });
    let monthString = formatter.format(new Date().setMonth(new Date().getMonth() - 1));
    for (var refreshToken of users) {
      var authOptions = {
        url: "https://accounts.spotify.com/api/token",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(client_id + ":" + client_secret).toString("base64"),
        },
        form: {
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        },
        json: true,
      };
      request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          var accessToken = body.access_token;
          spotifyApi.setRefreshToken(refreshToken);
          spotifyApi.setAccessToken(accessToken);
          spotifyApi.getMyTopTracks({ limit: 50, offset: 0, time_range: "short_term" }).then(
            data => {
              var topTracks = data.body.items;
              spotifyApi.createPlaylist(`Your Top Songs ${monthString} 2022`, { description: "Created by spotitools.com " + new Date().getMinutes().toString() }).then(
                playlistRes => spotifyApi.addTracksToPlaylist(playlistRes.body.id, topTracks.map(track => track.uri)))
            },
            err => console.log(err))
        }
      });
    }
  }
});

var app = express();

app
  .use(express.static(__dirname + "/client/build"))
  .use(cors())
  .use(cookieParser());

app.get("/login", function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-top-read",
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

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
      querystring.stringify({
        error: "state_mismatch",
      })
    );
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
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
        var access_token = body.access_token,
          refresh_token = body.refresh_token;

        var options = {
          url: "https://api.spotify.com/v1/me",
          headers: { Authorization: "Bearer " + access_token },
          json: true,
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (error, response, body) {
          console.log(body);
        });

        res.cookie("accessToken", access_token);
        res.cookie("refreshToken", refresh_token, {
          expires: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect("/");
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
  var refresh_token = req.cookies["refreshToken"];
  var authOptions = {
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
      var access_token = body.access_token;
      res.cookie("accessToken", access_token);
      res.redirect("/");
    }
  });
});

app.put("/subscribe_monthly_export", function (req, res) {
  let users = [];
  if (fs.existsSync(MONTHLY_TOP_SONGS_USERS_FILE)) {
    let rawdata = fs.readFileSync(MONTHLY_TOP_SONGS_USERS_FILE);
    users = JSON.parse(rawdata);
  }
  if (!users.includes(req.cookies["refreshToken"])) {
    users.push(req.cookies["refreshToken"])
    fs.writeFileSync(MONTHLY_TOP_SONGS_USERS_FILE, JSON.stringify(users));
  }
  res.end()
})

app.put("/unsubscribe_monthly_export", function (req, res) {
  let users = [];
  if (fs.existsSync(MONTHLY_TOP_SONGS_USERS_FILE)) {
    let rawdata = fs.readFileSync(MONTHLY_TOP_SONGS_USERS_FILE);
    users = JSON.parse(rawdata);
    users = users.filter(item => item !== req.cookies["refreshToken"])
    fs.writeFileSync(MONTHLY_TOP_SONGS_USERS_FILE, JSON.stringify(users));
  }
  res.end()
})

app.get("/monthly_export", function (req, res) {
  if (fs.existsSync(MONTHLY_TOP_SONGS_USERS_FILE)) {
    let rawdata = fs.readFileSync(MONTHLY_TOP_SONGS_USERS_FILE);
    let users = JSON.parse(rawdata);
    if (users.includes(req.cookies["refreshToken"])) {
      res.send({ result: true })
    }
  }
  res.send({ result: false })
})

app.use("*", express.static(__dirname + "/client/build"));

console.log("Listening on " + PORT);
app.listen(PORT);
