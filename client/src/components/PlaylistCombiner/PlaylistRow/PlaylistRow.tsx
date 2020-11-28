import React from "react";
import * as CheckMark from "../../../assets/checkmark_green.png";
import styles from "./PlaylistRow.module.scss";

export interface IPlaylistRowProps {
  playlist: SpotifyApi.PlaylistObjectSimplified;
  isChecked: boolean;
  handelSelectedPlaylists(
    playlist: SpotifyApi.PlaylistObjectSimplified,
    isChecked: boolean
  ): void;
}

export const PlaylistRow = (props: IPlaylistRowProps) => {
  const { playlist, isChecked } = props;

  return (
    <div
      className={styles.playlistRow}
      onClick={(_e) => props.handelSelectedPlaylists(playlist, !isChecked)}
    >
      <div className={styles.overlay}>
        <img
          className={styles.cover}
          src={
            playlist.images[playlist.images.length - 1] &&
            playlist.images[playlist.images.length - 1].url
          }
          alt="cover"
          height={60}
          width={60}
        ></img>
        <div className={styles.textWrapper}>
          <h5>{playlist.name}</h5>
          <div className={styles.subInfo}>
            <p>by {playlist.owner.display_name} </p>
            {/* <p>{playlist.tracks.total} tracks</p> */}
          </div>
        </div>
        {isChecked && (
          <img
            className={styles.checkImg}
            src={CheckMark.default}
            alt="check"
            width="20px"
            height="20px"
          />
        )}
      </div>
    </div>
  );
};
