import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Link, Routes } from "react-router-dom";

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
import { AuthRoute } from "./components/AuthRoute/AuthRoute";

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
          <Routes>
            <Route
              path="/check-song"
              element={
                <AuthRoute isLoggedIn={isLoggedIn}>
                  <Link className="link" to="/">
                    <Back width={32} height={32} />
                  </Link>
                  <h1>Spotitools</h1>
                  <CheckSong />
                </AuthRoute>
              }
            />
            <Route
              path="/merge-playlists"
              element={
                <AuthRoute isLoggedIn={isLoggedIn}>
                  <Link className="link" to="/">
                    <Back
                      width={32}
                      height={32}
                    />
                  </Link>
                  <h1>Spotitools</h1>
                  <PlaylistCombiner />
                </AuthRoute>} />
            <Route
              path="/top-songs-export"
              element={
                <AuthRoute isLoggedIn={isLoggedIn}>
                  <Link className="link" to="/">
                    <Back
                      width={32}
                      height={32}
                    />
                  </Link>
                  <h1>Spotitools</h1>
                  <TopTracksExport />
                </AuthRoute>} />
            <Route
              path="/recently-added"
              element={
                <AuthRoute isLoggedIn={isLoggedIn} >
                  <Link className="link" to="/">
                    <Back
                      width={32}
                      height={32}
                    />
                  </Link>
                  <h1>Spotitools</h1>
                  <RecentlyAdded />
                </AuthRoute>} />
            <Route
              path="/like-catalog"
              element={
                <AuthRoute isLoggedIn={isLoggedIn} >
                  <Link className="link" to="/">
                    <Back
                      width={32}
                      height={32}
                    />
                  </Link>
                  <h1>Spotitools</h1>
                  <LikeCatalog />
                </AuthRoute>} />
            <Route path="/*" element={<HomeView isLoggedIn={isLoggedIn} />} />
          </Routes>
        </BrowserRouter>
        {loadingUserData && <div className="LoadingWrapper">
          <div className="LoadingUserDataIndicator">
            <ClipLoader
              cssOverride={{ alignSelf: 'center' }}
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
