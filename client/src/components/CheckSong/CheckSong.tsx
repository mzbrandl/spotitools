import React, { useState, useContext } from "react";

import styles from "./CheckSong.module.scss";
import { SpotifyServiceContext } from "../../App";

export const CheckSong = () => {
  const spotifyService = useContext(SpotifyServiceContext);
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<
    SpotifyApi.SearchResponse | undefined
  >(undefined);
  return (
    <div className={styles.checkSong}>
      <input
        type="search"
        name="submit"
        id="submit"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <input
        type="submit"
        name="submit"
        id="submit"
        onClick={async () =>
          setSearchResult(await spotifyService?.searchTracks(query))
        }
      />
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
