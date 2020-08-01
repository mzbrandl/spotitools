import React from "react";

import styles from "./HomeView.module.scss";
import { Link } from "react-router-dom";

export interface IHomeViewProps {
  isLoggedIn: boolean;
}

export const HomeView = ({ isLoggedIn }: IHomeViewProps) => {
  return (
    <div className={styles.homeView}>
      <h1>Spotitools</h1>
      <p>
        Spotitools offers additional functionality, that missing in the default
        Spotify applications.
      </p>

      {!isLoggedIn && (
        <button
          className={styles.loginButton}
          onClick={() => window.location.assign("/login")}
        >
          Login with Spotify
        </button>
      )}

      {isLoggedIn && (
        <div className={styles.links}>
          <Link to="/check-song">
            Check which of your playlists contain a specific song
          </Link>
          <Link to="/queue-playlists">
            Create a queue that containins the songs of multiple playlists
          </Link>
          <Link to="/combine-playlists">
            Combine multiple playlists to a new playlist which updates itself
          </Link>
        </div>
      )}
    </div>
  );
};
