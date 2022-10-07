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
        Spotitools offers additional features, missing in the default
        Spotify applications. <br /> I mostly built this site for friends and personal
        use but thought, other people might also enjoy these features.
        You can view the source code on{" "}
        <a href="https://github.com/mzbrandl/spotitools">GitHub</a>.
      </p>

      {!isLoggedIn && (<>
        <p >Features include:
        </p>
        <ul style={{ textAlign: "start" }}>
          <li>Check which playlists contain a song</li>
          <li>Merge multiple playlists</li>
          <li>Export monthly top songs as playlist</li>
          <li>View chronological list of songs added to likes and playlists</li>
          <li>View liked songs not in any playlist</li>
        </ul>
        <button
          className={styles.loginButton}
          onClick={() => window.location.assign("/login")}
        >
          Login with Spotify
        </button>
      </>
      )}

      {isLoggedIn && (
        <div className={styles.links}>
          <Link to="/check-song">Check Song</Link>
          <p>Check which of your playlists contain a specific song.</p>
          <Link to="/merge-playlists">Merge Playlists</Link>
          <p>Create a queue made up of multiple playlists.</p>
          <Link to="/top-songs-export">Top Songs Export</Link>
          <p>Subscribe to have your monthly top songs exported as a playlist.</p>
          <Link to="/recently-added">Recently Added</Link>
          <p>View a list of the latest songs added to playlists or liked songs.</p>
          <Link to="/like-catalog">Like Catalog</Link>
          <p>Your liked songs, you haven't added to any playlist.</p>
        </div>
      )}
    </div>
  );
};
