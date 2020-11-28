import React, { useEffect, useState } from "react";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";

import { HomeView } from "./components/HomeView/HomeView";
import { CheckSong } from "./components/CheckSong/CheckSong";
import SpotifyService from "./services/SpotifyService";

import "./App.css";
import ISpotifyService from "./services/ISpotifyService";
import { PlaylistCombiner } from "./components/PlaylistCombiner/PlaylistCombiner";

export const SpotifyServiceContext = React.createContext(
  {} as ISpotifyService | undefined
);

export const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [spotifyService, setSpotifyService] = useState<ISpotifyService>();

  useEffect(() => {
    const cookies = Object.assign(
      {},
      ...document.cookie.split("; ").map((cookie) => {
        const pair = cookie.split("=");
        return { [pair[0]]: pair[1] };
      })
    );

    // get a fresh access token
    if (cookies["refreshToken"]) {
      fetch("/refresh_token");
    }

    SpotifyService.create(cookies["accessToken"]).then((res) =>
      setSpotifyService(res)
    );
    cookies["refreshToken"] && cookies["accessToken"] && setIsLoggedIn(true);
  }, []);

  return (
    <SpotifyServiceContext.Provider value={spotifyService}>
      <div className="App">
        <BrowserRouter>
          <Switch>
            <Route path="/check-song">
              <Link to="/">
                <h1>Spotitools</h1>
              </Link>
              <CheckSong />
            </Route>
            <Route path="/queue-playlists">
              <Link to="/">
                <h1>Spotitools</h1>
              </Link>
              <PlaylistCombiner />
            </Route>
            {/* <Route path="/combine-playlists">
              <p>Playlist combiner under construction...</p>
            </Route> */}
            <Route path="/*">
              <HomeView isLoggedIn={isLoggedIn} />
            </Route>
          </Switch>
        </BrowserRouter>
      </div>
    </SpotifyServiceContext.Provider>
  );
};
