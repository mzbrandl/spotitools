import React, { useContext, useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { css } from "@emotion/core";

import { SpotifyServiceContext } from "../../App";
import * as Play from "../../assets/play.png";
import { ListResult } from "../ListResult/ListResult";

import styles from "./PlaylistCombiner.module.scss";

export const PlaylistCombiner = () => {
  const spotifyService = useContext(SpotifyServiceContext);
  const [playlists, setplaylists] = useState<
    SpotifyApi.PlaylistObjectSimplified[]
  >([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState<
    SpotifyApi.PlaylistObjectSimplified[]
  >([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    spotifyService?.getPlaylists().then((res) => res && setplaylists(res));
  }, [spotifyService]);

  const onCreatePlaylistClick = async () => {
    await spotifyService?.queuePlaylists(selectedPlaylists);
    clearSelection();
  };

  const clearSelection = (): void => {
    setSelectedPlaylists([]);
    setFilter("");
  };

  const handelSelectedPlaylists = (id: string, isChecked: boolean) => {
    const selectedPlaylistsUpdated = selectedPlaylists;

    const playlist = playlists.filter((p) => p.id === id)[0];

    isChecked
      ? selectedPlaylistsUpdated.push(playlist)
      : selectedPlaylistsUpdated.splice(
          selectedPlaylistsUpdated.indexOf(playlist),
          1
        );

    setSelectedPlaylists([...selectedPlaylistsUpdated]);
  };

  return (
    <div className={styles.playlistCombiner}>
      <p>
        Select the playlists you want to add to a queue and start playback by
        pressing the play button.
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
          {playlists.length > 0 ? (
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
                  handelClick={handelSelectedPlaylists}
                />
              ))
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
        <button
          onClick={onCreatePlaylistClick}
          className={
            selectedPlaylists.length > 1 ? styles.createButton : styles.hide
          }
          disabled={selectedPlaylists.length < 2}
        >
          <img src={Play.default} alt="Play" />
        </button>
      </div>
    </div>
  );
};
