import React, { useState, useContext, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import { css } from "@emotion/core";

import { SpotifyServiceContext } from "../../App";
import { ListResult } from "../ListResult/ListResult";

import styles from "./CheckSong.module.scss";

export const CheckSong = () => {
  const spotifyService = useContext(SpotifyServiceContext);
  const [query, setQuery] = useState("");
  const [searchResultTracks, setSearchResultTracks] = useState<
    SpotifyApi.TrackObjectFull[] | undefined | null
  >(undefined);
  const [track, setTrack] = useState<SpotifyApi.TrackObjectFull>();
  const [playlistsAndTracks, setPlaylistsAndTracks] = useState<
    {
      playlist: SpotifyApi.PlaylistObjectSimplified;
      items: SpotifyApi.PlaylistTrackObject[];
    }[]
  >();

  useEffect(() => {
    spotifyService?.getCurrentPlayback().then((res) => {
      res.item?.name && setTrack(res.item);
    });
  }, [spotifyService]);

  useEffect(() => {
    spotifyService?.getPlaylistsAndTracks().then((res) => {
      setPlaylistsAndTracks(res);
    });
  }, [spotifyService]);

  const onSearch = async () => {
    if (query) {
      const res = await (await spotifyService?.searchTracks(query))?.tracks
        ?.items;
      setSearchResultTracks(res);
    } else {
      const res = await (await spotifyService?.getCurrentPlayback())?.item;
      res && setTrack(res);
    }
  };

  return (
    <div className={styles.checkSong}>
      <p>
        Check which of your playlists contain your last played song. You can
        also search for a song and check it.
      </p>
      <div className={styles.controls}>
        <input
          type="search"
          className={styles.filter}
          placeholder="Search song..."
          value={query}
          onKeyDown={async (e) => e.keyCode === 13 && onSearch()}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className={styles.button}
          name="search"
          id="submit"
          onClick={async () => onSearch()}
        >
          Search
        </button>
      </div>

      {track && !searchResultTracks && (
        <ListResult
          key={track.id}
          id={track.id}
          title={track.name}
          secondaryText={`by ${track.artists.map((a) => a.name).toString()}`}
          cover={track.album.images[0]}
          isChecked={true}
          handelClick={() => setTrack(undefined)}
        />
      )}

      {searchResultTracks &&
        searchResultTracks.map((t) => (
          <ListResult
            key={t.id}
            id={t.id}
            title={t.name}
            secondaryText={`by ${t.artists.map((a) => a.name).toString()}`}
            cover={t.album.images[0]}
            isChecked={t.id === track?.id}
            handelClick={() => {
              setTrack(t);
              setSearchResultTracks(undefined);
            }}
          />
        ))}

      {playlistsAndTracks ? (
        track && (
          <>
            <h3>Found in following playlists:</h3>
            {playlistsAndTracks
              .filter((p) =>
                p.items.map((i) => i.track as SpotifyApi.TrackObjectFull).some((t) => {
                  // Check for same id
                  if (t.id === track?.id) {
                    return true
                  }
                  // Check for name/artist match
                  if (`${t.name}:${t.artists[0].name}`.toLowerCase() === `${track.name}:${track.artists[0].name}`.toLowerCase()) {
                    return true
                  }
                  return false
                })
              )
              .map((pt, i) => (
                <ListResult
                  key={pt.playlist.id}
                  id={pt.playlist.id}
                  title={pt.playlist.name}
                  secondaryText={`added on ${new Date(
                    pt.items.find((i) => i.track.id === track.id || `${i.track.name}:${(i.track as SpotifyApi.TrackObjectFull).artists[0].name}`.toLowerCase() === `${track.name}:${track.artists[0].name}`.toLowerCase())
                      ?.added_at as string
                  ).toLocaleDateString()}`}
                  cover={pt.playlist.images[0]}
                  handelClick={() => window.location.href = pt.playlist.external_urls.spotify}
                />
              ))}
          </>
        )
      ) : (
        <div className={styles.loadingPlaylists}>
          <ClipLoader
            css={css`
              align-self: center;
            `}
            size={30}
            color={"#1db954"}
            loading={true}
          />
          <span>Loading playlists...</span>
        </div>
      )}
    </div>
  );
};
