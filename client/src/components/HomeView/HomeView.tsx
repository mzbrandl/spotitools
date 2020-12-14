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
        Spotitools offers additional functionality, missing in the default
        Spotify applications. <br/> I mostly built this site for my personal usage 
        but thought, other people might also enjoy these functionalities.
        You can view the source code on <a href="https://github.com/mzbrandl/spotitools">GitHub</a>.
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
          <Link to="/check-song">Check Song</Link>
          <p>Check which of your playlists contain a specific song.</p>
          <Link to="/queue-playlists">Queue Playlists</Link>
          <p>Create a queue made up of multiple playlists.</p>
          {/* <Link to="/combine-playlists">
            Combine multiple playlists to a new playlist which updates itself
          </Link> */}
        </div>
      )}
    </div>
  );
};
