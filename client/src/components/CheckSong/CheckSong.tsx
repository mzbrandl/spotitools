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
      <div className={styles.controls}>
        <input
          type="search"
          className={styles.filter}
          placeholder="Filter"
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
          author={track.artists.map((a) => a.name)}
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
            author={t.artists.map((a) => a.name)}
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
            <h3 style={{ textAlign: "left" }}>Found in following playlists:</h3>
            {playlistsAndTracks
              .filter((p) =>
                p.items.map((i) => i.track).some((t) => t.id === track.id)
              )
              .map((pt, i) => (
                <ListResult
                  key={pt.playlist.id}
                  id={pt.playlist.id}
                  title={pt.playlist.name}
                  author={
                    pt.items.find((i) => i.track.id === track.id)?.added_at
                  }
                  cover={pt.playlist.images[0]}
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
