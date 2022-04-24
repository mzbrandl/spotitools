import React, { useState, useContext, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import { css } from "@emotion/core";

import { SpotifyServiceContext } from "../../App";
import { ListResult } from "../ListResult/ListResult";

import styles from "./RecentlyAdded.module.scss";
import { TrackWithPlaylistName } from "../../services/ISpotifyService";

export const RecentlyAdded = () => {
  const spotifyService = useContext(SpotifyServiceContext);
  const [loading, setLoading] = useState(true);
  const [playlistsAndTracks, setPlaylistsAndTracks] = useState<
    TrackWithPlaylistName[]
  >([]);

  useEffect(() => {
    setLoading(true);
    spotifyService?.getRecentlyAddedTracks().then((res) => {
      setPlaylistsAndTracks(res);
      setLoading(false);
    });
  }, [spotifyService]);

  console.log(playlistsAndTracks);

  return (
    <div className={styles.recentlyAdded}>
      <p>
        Here is a chronological list of songs you recently added to a playlist
        or to your liked songs.
      </p>
      {loading && (
        <div className={styles.loadingPlaylists}>
          <ClipLoader
            css={css`
              align-self: center;
            `}
            size={30}
            color={"#1db954"}
            loading={true}
          />
          <span>Loading...</span>
        </div>
      )}
      {playlistsAndTracks?.length > 0 &&
        playlistsAndTracks?.map((item, index) => (
          <ListResult
            key={item.track.id + index}
            id={item.track.id}
            title={item.track.name}
            secondaryText={`by ${(
              item.track as SpotifyApi.TrackObjectFull
            ).artists
              .map((a) => a.name)
              .toString()}`}
            tertiaryText={`in ${item.playlistName}, ${Math.floor((Date.now() - Date.parse(item.added_at)) / 86400000)} days ago`}
            cover={(item.track as SpotifyApi.TrackObjectFull).album.images[0]}
            // isChecked={true}
            // handelClick={() => setTrack(undefined)}
          />
        ))}
    </div>
  );
};
