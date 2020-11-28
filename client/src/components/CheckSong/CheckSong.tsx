import React, { useState, useContext, useEffect } from "react";

import styles from "./CheckSong.module.scss";
import { SpotifyServiceContext } from "../../App";

export const CheckSong = () => {
  const spotifyService = useContext(SpotifyServiceContext);
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<
    SpotifyApi.SearchResponse | undefined
  >(undefined);
  const [
    currentPlayback,
    setCurrentPlayback,
  ] = useState<SpotifyApi.CurrentPlaybackResponse>();
  const [playlists, setPlaylists] = useState([] as any);

  useEffect(() => {
    spotifyService?.getCurrentPlayback().then((res) => {
      setCurrentPlayback(res);
      res.item?.name && setQuery(res.item?.name);
    });

    if (currentPlayback?.item) {
      spotifyService
        ?.checkPlaylistsForTrack(currentPlayback?.item)
        .then((res) => setPlaylists([...res]));
      console.log(playlists);
    }
  }, [spotifyService, currentPlayback]);

  return (
    <div className={styles.checkSong}>
      <div className={styles.controls}>
        <input
          type="search"
          className={styles.filter}
          placeholder="Filter"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          className={styles.button}
          type="submit"
          name="search"
          id="submit"
          onClick={async () =>
            setSearchResult(await spotifyService?.searchTracks(query))
          }
        />
      </div>

      {playlists && playlists.map((playlist: any) => <p>{playlist.name}</p>)}

      {searchResult &&
        searchResult.tracks?.items.map((track) => (
          <div style={{ display: "flex", flexDirection: "row" }}>
            <h3>{track.name}</h3>
            <p>{` by ${track.artists
              .map((artist) => artist.name)
              .toString()}`}</p>
          </div>
        ))}
    </div>
  );
};
