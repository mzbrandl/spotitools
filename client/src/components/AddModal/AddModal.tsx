import React, { useContext, useEffect, useMemo, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { css } from '@emotion/react'
import { playlistsAtom, SpotifyServiceContext } from "../../App";
import { ListResult } from "../ListResult/ListResult";
import { ReactComponent as Back } from "../../assets/back.svg";
import styles from "./AddModal.module.scss";
import { useAtom } from "jotai";

export interface IAddModalProps {
  trackUri: string;
  onClose: () => void;
}

export const AddModal: React.FC<IAddModalProps> = ({ trackUri, onClose }) => {
  const spotifyService = useContext(SpotifyServiceContext);
  const [playlists] = useAtom(playlistsAtom);
  const [filter, setFilter] = useState("");

  const filteredPlaylists = useMemo(() => {
    return playlists?.filter(item => item.collaborative || item.owner.id === spotifyService?.userId)
  }, [playlists])

  const onAddClick = async (playlistId: string) => {
    await spotifyService?.addToPlaylist(playlistId, trackUri)
    onClose();
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.addModal}>
        <Back
          width={32}
          height={32}
          style={{ position: "absolute", fill: "white", marginTop: "10px", padding: "5px 5px 5px 20px", cursor: "pointer" }}
          onClick={() => onClose()}
        />
        <p style={{ justifySelf: "center", fontSize: "1.2em" }}>
          <b>Add to Playlist</b>
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
              <button className={styles.clearBtn} onClick={() => setFilter("")}>
                Clear
              </button>
            </div>
            {filteredPlaylists && filteredPlaylists.length > 0 ? (
              filteredPlaylists
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
                    cover={playlist.images?.[0]}
                    handleClick={() => onAddClick(playlist.id)}
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
        </div>
      </div>
    </div>
  );
};
