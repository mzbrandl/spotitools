import Spotify from "spotify-web-api-js";
import ISpotifyService from "./ISpotifyService";

export default class SpotifyService implements ISpotifyService {
  private spotifyApi!: Spotify.SpotifyWebApiJs;
  private userId!: string;

  /**
   * Creates a SpotifyService instance.
   * @param accessToken spotify access token
   */
  public static async create(accessToken: string): Promise<ISpotifyService> {
    const spotifyService = new SpotifyService();
    spotifyService.spotifyApi = new Spotify();
    spotifyService.spotifyApi.setAccessToken(accessToken);
    const userResponse = await spotifyService.spotifyApi.getMe();
    spotifyService.userId = userResponse.id;
    return spotifyService;
  }

  public async getPlaylists(): Promise<SpotifyApi.PlaylistObjectSimplified[]> {
    const getPlaylistsRecursive = async (
      offset: number
    ): Promise<SpotifyApi.PlaylistObjectSimplified[]> => {
      const res = await this.spotifyApi.getUserPlaylists(this.userId, {
        limit: 50, //max limit
        offset,
      });
      return res.items.length + offset === res.total
        ? res.items
        : [...res.items, ...(await getPlaylistsRecursive(offset + 50))];
    };
    return await getPlaylistsRecursive(0);
  }

  public async queuePlaylists(
    playlists: SpotifyApi.PlaylistObjectSimplified[]
  ): Promise<void> {
    // create new playlist
    const queuePlaylist = await this.spotifyApi.createPlaylist(this.userId, {
      name: "Queued Playlists",
      description: `Queue of following playlists:${playlists
        .map((p) => ` "${p.name}"`)
        .toString()}`,
    });

    const tracks = await this.getUniqueTracks(playlists);

    await this.addTracks(queuePlaylist.id, tracks);

    await this.spotifyApi.play({ context_uri: queuePlaylist.uri });

    await this.spotifyApi.setShuffle(true);

    await this.spotifyApi.unfollowPlaylist(queuePlaylist.id);

    window.location.replace(queuePlaylist.uri);
  }

  public async getLatestPlaybackItem(): Promise<SpotifyApi.TrackObjectFull | null> {
    return (await this.spotifyApi.getMyCurrentPlaybackState()).item;
  }

  public async checkPlaylistsForTrack(
    track: SpotifyApi.TrackObjectFull
  ): Promise<any> {
    const playlists = (await this.getPlaylists()).filter(
      (playlist) =>
        playlist.owner.id === this.userId || playlist.collaborative === true
    );

    const playlistsAndTracks = await Promise.all(
      playlists.map(async (playlist) => {
        return { playlist, items: await this.getPlaylistTracks(playlist) };
      })
    );

    const filteredPlaylists = playlistsAndTracks
      .filter((pat) => pat.items.some((item) => item.track.id === track.id))
      .map((pat) => pat.playlist);

    return filteredPlaylists;
  }

  public async searchTracks(
    query: string,
    limit?: number
  ): Promise<SpotifyApi.SearchResponse> {
    return await this.spotifyApi.search(
      query,
      ["track"],
      limit ? { limit } : {}
    );
  }

  /**
   * Adds the given tracks to the playlist with the given id.
   * @param playlistId Id of the playlist to which the tracks will be added.
   * @param tracks Array of tracks.
   */
  private addTracks = async (
    playlistId: string,
    tracks: (SpotifyApi.TrackObjectFull | SpotifyApi.EpisodeObjectFull)[]
  ): Promise<any> => {
    const trackUris = tracks
      .map((track) => track.uri)
      .filter((uri) => !uri.includes("local")); // Ignore local tracks
    for (let i = 0; i < trackUris.length / 99; i++) {
      let chunk = trackUris.slice(i * 99, (i + 1) * 99);
      await this.spotifyApi.addTracksToPlaylist(playlistId, chunk);
    }
  };

  /**
   * Returns the track items of the given playlist.
   * This function gets called frequently, so it contains some meassures to handle API rate-limiting
   * @param playlist the playlist for which to get the corresponding items
   */
  private async getPlaylistTracks(
    playlist: SpotifyApi.PlaylistObjectSimplified
  ): Promise<SpotifyApi.PlaylistTrackObject[]> {
    const getPlaylistTracksRecursive = async (
      playlist: SpotifyApi.PlaylistObjectSimplified,
      offset: number
    ): Promise<SpotifyApi.PlaylistTrackResponse> => {
      // using fetch API to get response header 'retry-after' in case of 429 code
      const res = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=100&offset=${offset}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.spotifyApi.getAccessToken()}`,
          },
        }
      ).then(async (res) => {
        // handle spotify API rate-limiting
        if (res.headers.get("retry-after")) {
          console.log(res.headers.get("retry-after"));
          await sleep(Number(res.headers.get("retry-after")) * 1000);
          return await getPlaylistTracksRecursive(playlist, offset);
        }
        return res.json();
      });

      // recursively concat response items array
      return res.items.length + res.offset === res.total
        ? res
        : {
            ...res,
            items: [
              ...res.items,
              ...(await getPlaylistTracksRecursive(playlist, offset + 100))
                .items,
            ],
          };
    };
    return (await getPlaylistTracksRecursive(playlist, 0)).items;
  }

  /**
   * Returns an array of all unique tracks from the given playlists.
   * @param playlists Array of playlist for which to get the track items
   */
  private getUniqueTracks = async (
    playlists: SpotifyApi.PlaylistObjectSimplified[]
  ): Promise<(SpotifyApi.TrackObjectFull | SpotifyApi.EpisodeObjectFull)[]> => {
    let accumulatedPlaylistTracks: SpotifyApi.PlaylistTrackObject[] = [];
    // using plain loop because of async call
    for (let i = 0; i < playlists.length; i++) {
      accumulatedPlaylistTracks = [
        ...accumulatedPlaylistTracks,
        ...(await this.getPlaylistTracks(playlists[i])),
      ];
    }
    const accumulatedTracks = accumulatedPlaylistTracks.map((tr) => tr.track);
    const uniqueAccumulatedTracks = accumulatedTracks.filter(
      (item, index, self) => self.findIndex((i) => i.id === item.id) === index
    );
    return uniqueAccumulatedTracks;
  };
}

/**
 * Helper for sleeping.
 * @param ms Amount of sleep in ms.
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
