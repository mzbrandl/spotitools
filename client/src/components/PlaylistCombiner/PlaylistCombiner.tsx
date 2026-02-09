import React, { useContext, useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { css } from '@emotion/react'
import { playlistsAtom, SpotifyServiceContext } from "../../App";
import * as Play from "../../assets/play.png";
import { ListResult } from "../ListResult/ListResult";

import styles from "./PlaylistCombiner.module.scss";
import { useAtom } from "jotai";

export const PlaylistCombiner = () => {
  const spotifyService = useContext(SpotifyServiceContext);
  const [playlists] = useAtom(playlistsAtom);

  const [selectedPlaylists, setSelectedPlaylists] = useState<
    SpotifyApi.PlaylistObjectSimplified[]
  >([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false)

  const onCreatePlaylistClick = async () => {
    setLoading(true)
    const url = await spotifyService?.queuePlaylists(selectedPlaylists);
    clearSelection();
    setLoading(false);
  };

  const clearSelection = (): void => {
    setSelectedPlaylists([]);
    setFilter("");
  };

  const handelSelectedPlaylists = (id: string, isChecked: boolean) => {
    if (!!playlists) {
      const selectedPlaylistsUpdated = selectedPlaylists;

      const playlist = playlists.filter((p) => p.id === id)[0];

      isChecked
        ? selectedPlaylistsUpdated.push(playlist)
        : selectedPlaylistsUpdated.splice(
          selectedPlaylistsUpdated.indexOf(playlist),
          1
        );

      setSelectedPlaylists([...selectedPlaylistsUpdated]);
    }
  };

  return (
    <div className={styles.playlistCombiner}>
      <p>
        Select the playlists you want to merge. Duplicate songs will be filtered.
      </p>
      <div className={styles.horWraper}>
        <div className={styles.playlistRows}>
          <div className={styles.controls}>
            <input
              type="search"
              className={styles.filter}
              placeholder="Filter"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
              }}
            />
            <button className={styles.clearBtn} onClick={clearSelection}>
              Clear
            </button>
          </div>
          {!!playlists && playlists.length > 0 ? (
            playlists
              .filter(
                (p) =>
                  p.name.toLowerCase().includes(filter.toLowerCase()) ||
                  p.owner.display_name
                    ?.toLowerCase()
                    .includes(filter.toLowerCase())
              )
              .map((playlist, key) => (
                <ListResult
                  key={key}
                  id={playlist.id}
                  title={playlist.name}
                  secondaryText={`by ${playlist.owner.display_name}`}
                  cover={playlist.images[0]}
                  isChecked={selectedPlaylists.includes(playlist)}
                  handleClick={!loading ? handelSelectedPlaylists : undefined}
                />
              ))
          ) : (
            <div className={styles.loadingPlaylists}>
              <ClipLoader
                cssOverride={{alignSelf: 'center'}}
                size={30}
                color={"#1db954"}
                loading={true}
              />
              <span>Loading playlists...</span>
            </div>
          )}
        </div>
        <button
          onClick={onCreatePlaylistClick}
          className={
            selectedPlaylists.length > 1 ? styles.createButton : styles.hide
          }
          style={loading ? { cursor: "default", opacity: "0.6" } : {}}
          disabled={loading || selectedPlaylists.length < 2}
        >
          <img src={Play.default} alt="Play" />
        </button>
        {loading && <div className={styles.mergeLoading} >
          <ClipLoader
            cssOverride={{alignSelf: 'center'}}
            size={30}
            color={"#1db954"}
            loading={true}
          />
          <span>Merging playlists...</span>
        </div>}
      </div>
    </div>
  );
};
