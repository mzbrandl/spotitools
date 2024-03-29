export default interface ISpotifyService {
  userId: string;

  /**
   * Returns all playlist which the current user is following.
   */
  getPlaylists(): Promise<SpotifyApi.PlaylistObjectSimplified[]>;

  /**
   * Creates a temporary playlist containing the tracks of the given playlists.
   * The created playlist gets set to playback with shuffle and is unfollowed.
   * @param playlists The playlists which should be put in the queue.
   */
  queuePlaylists(
    playlists: SpotifyApi.PlaylistObjectSimplified[]
  ): Promise<string>;

  /**
   * Returns all the users playlists that contain the given track.
   * Only search playlists created by the user and collaberative playlists.
   * @param track The track to search for.
   */
  checkPlaylistsForTrack(
    track: SpotifyApi.TrackObjectFull
  ): Promise<SpotifyApi.PlaylistObjectSimplified[]>;

  /**
   * Returns the Playlists with corresponding tracks of the current user.
   */
  getPlaylistsAndTracks(progress_cb: (progress: string) => any, propsPlaylists?: SpotifyApi.PlaylistObjectSimplified[]): Promise<PlaylistAndTracks[]>;

  /**
   * Returns the last played track uf the current user or null.
   */
  getLatestPlaybackItem(): Promise<SpotifyApi.TrackObjectFull | null>;

  /**
   * Search Spotify for tracks.
   * @param query String used as search query
   * @param limit amount of items to return, default = 20
   */
  searchTracks(
    query: string,
    limit?: number
  ): Promise<SpotifyApi.SearchResponse>;

  getCurrentPlayback(): Promise<SpotifyApi.CurrentPlaybackResponse>;

  getRecentlyAddedTracks(): Promise<TrackWithPlaylistName[]>;

  getLikedTracks(): Promise<SpotifyApi.PlaylistTrackObject[]>;
  playTrack(track: SpotifyApi.TrackObjectFull): void;
  addToPlaylist(playlistId: string, trackUri: string): Promise<void>;
}

export interface TrackWithPlaylistName extends SpotifyApi.PlaylistTrackObject {
  playlistName: string;
}

export interface PlaylistAndTracks {
  playlist: SpotifyApi.PlaylistObjectSimplified;
  items: SpotifyApi.PlaylistTrackObject[];
}
