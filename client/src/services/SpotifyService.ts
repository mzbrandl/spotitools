import Spotify from "spotify-web-api-js";
import ISpotifyService, { TrackWithPlaylistName } from "./ISpotifyService";

export default class SpotifyService implements ISpotifyService {

  private spotifyApi!: Spotify.SpotifyWebApiJs;
  public userId!: string;

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
      const normalizedItems = res.items.map((playlist) => ({
        ...playlist,
        images: playlist.images ?? [],
      }));
      return normalizedItems.length + offset === res.total
        ? normalizedItems
        : [
            ...normalizedItems,
            ...(await getPlaylistsRecursive(offset + 50)),
          ];
    };
    return getPlaylistsRecursive(0);
  }

  public async queuePlaylists(
    playlists: SpotifyApi.PlaylistObjectSimplified[]
  ): Promise<string> {
    // create new playlist
    const queuePlaylist = await this.spotifyApi.createPlaylist(this.userId, {
      name: "Merged Playlist",
      description: `Combines the playlists:${playlists
        .map((p) => ` ${p.name}`)
        .toString()}`,
    });

    const tracks = await this.getUniqueTracks(playlists);

    await this.addTracks(queuePlaylist.id, tracks);

    await this.spotifyApi.play({ context_uri: queuePlaylist.uri });

    await this.spotifyApi.setShuffle(true);

    window.location.replace(queuePlaylist.uri);
    return queuePlaylist.uri;

    // await this.spotifyApi.unfollowPlaylist(queuePlaylist.id);

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

    return playlistsAndTracks
      .filter((pat) => pat.items.some((item) => item.track.id === track.id))
      .map((pat) => pat.playlist);
  }

  public async getPlaylistsAndTracks(progress_cb: (progress: string) => any, propsPlaylists?: SpotifyApi.PlaylistObjectSimplified[]): Promise<
    {
      playlist: SpotifyApi.PlaylistObjectSimplified;
      items: SpotifyApi.PlaylistTrackObject[];
    }[]
  > {
    let playlists = propsPlaylists || await this.getPlaylists();
    playlists = playlists.filter(
      (playlist) =>
        playlist.owner.id === this.userId || playlist.collaborative === true
    );

    let counter = 0;

    const playlistPromises = playlists.map(async (playlist) => {
      return { playlist, items: await this.getPlaylistTracks(playlist) };
    })

    for (const p of playlistPromises) {
      p.then(() => {
        counter++;
        progress_cb(`Loaded ${counter} of ${playlistPromises?.length} playlists`);
      });
    }
    return Promise.all(playlistPromises);
  }

  public async searchTracks(
    query: string,
    limit?: number
  ): Promise<SpotifyApi.SearchResponse> {
    return this.spotifyApi.search(query, ["track"], limit ? { limit } : {});
  }

  public async getRecentlyAddedTracks(): Promise<TrackWithPlaylistName[]> {
    const playlists = (await this.getPlaylists()).filter(
      (playlist) =>
        playlist.owner.id === this.userId || playlist.collaborative === true
    );

    const playlistTracks = await Promise.all(
      playlists.map(async (playlist) => {
        return { playlist, items: await this.getPlaylistTracks(playlist) };
      })
    );

    const trackList = playlistTracks.reduce((acc, item) => {
      const is = item.items.map((i) => ({
        ...i,
        playlistName: item.playlist.name,
      }));
      acc = [...acc, ...is];
      return acc;
    }, <TrackWithPlaylistName[]>[]);

    return trackList.sort((a, b) => {
      return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
    });
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
   * This function gets called frequently, so it contains some measures to handle API rate-limiting
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
          // console.log("retry-after: " + res.headers.get("retry-after"));
          await sleep(Number(res.headers.get("retry-after")) * 1000);
          return getPlaylistTracksRecursive(playlist, offset);
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
      (item, index, self) => self.findIndex((i) => SpotifyService.isSameTrack(i as SpotifyApi.TrackObjectFull, item as SpotifyApi.TrackObjectFull)) === index
    );
    return uniqueAccumulatedTracks;
  };

  public async getCurrentPlayback(): Promise<SpotifyApi.CurrentPlaybackResponse> {
    return this.spotifyApi.getMyCurrentPlaybackState();
  }

  /**
   * Returns the track items of the given playlist.
   * This function gets called frequently, so it contains some measures to handle API rate-limiting
   * @param playlist the playlist for which to get the corresponding items
   */
  public async getLikedTracks(): Promise<SpotifyApi.PlaylistTrackObject[]> {
    const getLikedTracksRecursive = async (
      offset: number
    ): Promise<SpotifyApi.PlaylistTrackResponse> => {
      // using fetch API to get response header 'retry-after' in case of 429 code
      const res = await fetch(
        `https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.spotifyApi.getAccessToken()}`,
          },
        }
      ).then(async (res) => {
        // handle spotify API rate-limiting
        if (res.headers.get("retry-after")) {
          // console.log("retry-after: " + res.headers.get("retry-after"));
          await sleep(Number(res.headers.get("retry-after")) * 1000);
          return await getLikedTracksRecursive(offset);
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
            ...(await getLikedTracksRecursive(offset + 50))
              .items,
          ],
        };
    };
    return (await getLikedTracksRecursive(0)).items;
  }

  public async playTrack(track: SpotifyApi.TrackObjectFull): Promise<void> {
    await this.spotifyApi.play({ context_uri: track.album.uri, offset: { uri: track.uri } });
  }

  /**
   * Spotify has multiple instances of the same song for different markets.
   * Simple comparison of id is not always enough to determine sameness.
   */
  public static isSameTrack(trackA: SpotifyApi.TrackObjectFull, trackB: SpotifyApi.TrackObjectFull): boolean {
    // Check for same id
    if (trackA.id === trackB.id) {
      return true
    }
    // Check for name/artist match
    if (`${trackA.name}:${trackA.artists[0].name}`.toLowerCase() === `${trackB.name}:${trackB.artists[0].name}`.toLowerCase()) {
      // Check if duration difference is less than 5 seconds
      if (Math.abs(trackA.duration_ms - trackB.duration_ms) < 5000)
        return true
    }
    return false
  }

  public async addToPlaylist(playlistId: string, trackUri: string): Promise<void> {
    await this.spotifyApi.addTracksToPlaylist(playlistId, [trackUri],)
  }
}

/**
 * Helper for sleeping.
 * @param ms Amount of sleep in ms.
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
