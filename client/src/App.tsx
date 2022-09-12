import React, { useEffect, useState } from "react";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";

import { HomeView } from "./components/HomeView/HomeView";
import { CheckSong } from "./components/CheckSong/CheckSong";
import SpotifyService from "./services/SpotifyService";

import "./App.css";
import ISpotifyService, { PlaylistAndTracks } from "./services/ISpotifyService";
import { PlaylistCombiner } from "./components/PlaylistCombiner/PlaylistCombiner";
import { RecentlyAdded } from "./components/RecentlyAdded/RecentlyAdded";
import { TopTracksExport } from "./components/TopTracksExport/TopTracksExport";
import { atom, useAtom } from "jotai";
import ClipLoader from "react-spinners/ClipLoader";
import { css } from "@emotion/react";
import { LikeCatalog } from "./components/LikeCatalog/LikeCatalog";

export const SpotifyServiceContext = React.createContext(
  {} as ISpotifyService | undefined
);

export const playlistsAndTracksAtom = atom<PlaylistAndTracks[] | null>(null);
export const playlistsAtom = atom<SpotifyApi.PlaylistObjectSimplified[] | null>(null);
export const likedTracksAtom = atom<SpotifyApi.PlaylistTrackObject[] | null>(null);
export const likedTracksFilteredAtom = atom<SpotifyApi.PlaylistTrackObject[] | null>(null);


export const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [spotifyService, setSpotifyService] = useState<ISpotifyService>();
  const [playlistsAndTracks, setPlaylistsAndTracks] = useAtom(playlistsAndTracksAtom);
  const [playlists, setplaylists] = useAtom(playlistsAtom);
  const [likedTracks, setLikedTracks] = useAtom(likedTracksAtom);
  const [loadingUserData, setLoadingUserData] = useState(false);

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

    SpotifyService.create(cookies["accessToken"]).then(
      (res) =>
        setSpotifyService(res),
      (error) => {
        setIsLoggedIn(false);
        return;
      }
    );

    cookies["refreshToken"] && cookies["accessToken"] && setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    (async () => {
      if (isLoggedIn && !!spotifyService) {
        setLoadingUserData(true)
        const playlistTracks = await spotifyService?.getPlaylistsAndTracks();
        setPlaylistsAndTracks(playlistTracks);
        const likedTracks = await spotifyService?.getLikedTracks();
        setLikedTracks(likedTracks);
        const playlists = await spotifyService.getPlaylists();
        setplaylists(playlists);
        setLoadingUserData(false);
      }
    })();
  }, [isLoggedIn, spotifyService]);

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
            <Route path="/top-songs-export">
              <Link to="/">
                <h1>Spotitools</h1>
              </Link>
              <TopTracksExport />
            </Route>
            <Route path="/recently-added">
              <Link to="/">
                <h1>Spotitools</h1>
              </Link>
              <RecentlyAdded />
            </Route>
            <Route path="/like-catalog">
              <Link to="/">
                <h1>Spotitools</h1>
              </Link>
              <LikeCatalog />
            </Route>
            {/* <Route path="/combine-playlists">
              <p>Playlist combiner under construction...</p>
            </Route> */}
            <Route path="/*">
              <HomeView isLoggedIn={isLoggedIn} />
            </Route>
          </Switch>
        </BrowserRouter>
        {loadingUserData && <div className="LoadingWrapper">
          <div className="LoadingUserDataIndicator">
            <ClipLoader
              css={css`
              align-self: center;
            `}
              size={16}
              color={"#1db954"}
              loading={true}
            />
            <span>
              Loading user data...
            </span>
          </div>
        </div>}
      </div>
    </SpotifyServiceContext.Provider>
  );
};
