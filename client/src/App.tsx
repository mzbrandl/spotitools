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
import { ReactComponent as Back } from "./assets/back.svg";

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
  const [playlists, setPlaylists] = useAtom(playlistsAtom);
  const [likedTracks, setLikedTracks] = useAtom(likedTracksAtom);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);

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
        setLoadingMessage("Scanning playlists...")
        const playlists = await spotifyService.getPlaylists();
        setPlaylists(playlists);
        const playlistTracks = await spotifyService?.getPlaylistsAndTracks((progress) => setLoadingMessage(progress), playlists);
        setPlaylistsAndTracks(playlistTracks);
        setLoadingMessage("Loading likes...")
        const likedTracks = await spotifyService?.getLikedTracks();
        setLikedTracks(likedTracks);
        setLoadingMessage(undefined)
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
              <Link className="link" to="/">
                <Back
                  width={32}
                  height={32}
                />
              </Link>
              <h1>Spotitools</h1>
              <CheckSong />
            </Route>
            <Route path="/merge-playlists">
              <Link className="link" to="/">
                <Back
                  width={32}
                  height={32}
                />
              </Link>
              <h1>Spotitools</h1>
              <PlaylistCombiner />
            </Route>
            <Route path="/top-songs-export">
              <Link className="link" to="/">
                <Back
                  width={32}
                  height={32}
                />
              </Link>
              <h1>Spotitools</h1>
              <TopTracksExport />
            </Route>
            <Route path="/recently-added">
              <Link className="link" to="/">
                <Back
                  width={32}
                  height={32}
                />
              </Link>
              <h1>Spotitools</h1>
              <RecentlyAdded />
            </Route>
            <Route path="/like-catalog">
              <Link className="link" to="/">
                <Back
                  width={32}
                  height={32}
                />
              </Link>
              <h1>Spotitools</h1>
              <LikeCatalog />
            </Route>
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
              {loadingMessage}
            </span>
          </div>
        </div>}
      </div>
    </SpotifyServiceContext.Provider>
  );
};
