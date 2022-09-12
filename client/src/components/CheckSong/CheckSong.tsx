import React, { useState, useContext, useEffect, useMemo } from "react";

import { playlistsAndTracksAtom, SpotifyServiceContext } from "../../App";
import { ListResult } from "../ListResult/ListResult";

import styles from "./CheckSong.module.scss";
import { useAtom } from "jotai";
import SpotifyService from "../../services/SpotifyService";
import { ReactComponent as Refresh } from '../../assets/refresh.svg';

export const CheckSong = () => {
  const spotifyService = useContext(SpotifyServiceContext);
  const [query, setQuery] = useState("");
  const [searchResultTracks, setSearchResultTracks] = useState<
    SpotifyApi.TrackObjectFull[] | undefined | null
  >(undefined);
  const [track, setTrack] = useState<SpotifyApi.TrackObjectFull>();
  const [playlistsAndTracks] = useAtom(playlistsAndTracksAtom)

  useEffect(() => {
    setCurrentPlayback();
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

  const setCurrentPlayback = () => {
    spotifyService?.getCurrentPlayback().then((res) => {
      res.item?.name && setTrack(res.item);
    });
  }

  const playlistsWithTrack = useMemo(() => {
    if (!!track) {
      return playlistsAndTracks?.filter((p) =>
        p.items.map((i) => i.track as SpotifyApi.TrackObjectFull).some((t) => SpotifyService.isSameTrack(t, track!))
      )
    }
  }, [playlistsAndTracks, track]);

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
        // handleClick={() => setCurrentPlayback()}
        >
          <div style={{ color: "white", display: "flex", alignItems: "center" }}>
            <Refresh style={{ fill: "white", cursor: "pointer" }}
              onClick={() => setCurrentPlayback()} />
          </div>
        </ListResult>
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
            handleClick={() => {
              setTrack(t);
              setSearchResultTracks(undefined);
            }}
          />
        ))}

      {playlistsAndTracks && !searchResultTracks && track && (
        <>
          <h3>{playlistsWithTrack && playlistsWithTrack.length > 0 ? "Found in following playlists:" : "Not found in any playlist"}</h3>
          {playlistsWithTrack?.map((pt, i) => (
            <ListResult
              key={pt.playlist.id}
              id={pt.playlist.id}
              title={pt.playlist.name}
              secondaryText={`added on ${new Date(
                pt.items.find((i) => i.track.id === track.id || `${i.track.name}:${(i.track as SpotifyApi.TrackObjectFull).artists[0].name}`.toLowerCase() === `${track.name}:${track.artists[0].name}`.toLowerCase())
                  ?.added_at as string
              ).toLocaleDateString()}`}
              cover={pt.playlist.images[0]}
              handleClick={() => window.location.href = pt.playlist.external_urls.spotify}
            />
          ))}
        </>
      )}
    </div>
  );
};


