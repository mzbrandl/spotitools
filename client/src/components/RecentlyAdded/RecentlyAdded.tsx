import React, { useState, useContext, useEffect, useMemo } from "react";
import { ClipLoader } from "react-spinners";
import { css } from "@emotion/core";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { playlistsAndTracksAtom, SpotifyServiceContext } from "../../App";
import { ListResult } from "../ListResult/ListResult";

import styles from "./RecentlyAdded.module.scss";
import { TrackWithPlaylistName } from "../../services/ISpotifyService";
import { useAtom } from "jotai";
import { useVirtualizer } from "@tanstack/react-virtual";

dayjs.extend(relativeTime);

export const RecentlyAdded = () => {
  const spotifyService = useContext(SpotifyServiceContext);
  const [playlistsAndTracks] = useAtom(playlistsAndTracksAtom)
  const parentRef = React.useRef(null)
  const paragraphRef = React.useRef<HTMLParagraphElement>(null)
  const [listHeight, setListHeight] = useState(200)

  const recentlyAddedTracks = useMemo<TrackWithPlaylistName[] | undefined>(() => {
    const trackList = playlistsAndTracks?.reduce<TrackWithPlaylistName[]>((acc, item) => {
      const is = item.items.map((i) => ({
        ...i,
        playlistName: item.playlist.name,
      }));
      acc = [...acc, ...is];
      return acc;
    }, []);

    return trackList?.sort((a, b) => {
      return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
    });
  }, [playlistsAndTracks])

  const rowVirtualizer = useVirtualizer({
    count: recentlyAddedTracks ? recentlyAddedTracks.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  })

  useEffect(() => {
    check()
  }, [paragraphRef])

  const check = () => {
    if (!!paragraphRef.current) {
      let { bottom } = paragraphRef.current.getBoundingClientRect()
      setListHeight(window.innerHeight - bottom - 20)
    }
  }

  return (
    <div className={styles.recentlyAdded}>
      <p ref={paragraphRef}>
        Here is a chronological list of songs you recently added to a playlist.
      </p>
      {recentlyAddedTracks && <div
        ref={parentRef}
        style={{
          height: listHeight,
          overflow: 'auto', // Make it scroll!
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const track = recentlyAddedTracks[virtualItem.index].track as SpotifyApi.TrackObjectFull
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <ListResult
                  key={track.id + virtualItem.index}
                  id={track.id}
                  title={track.name}
                  secondaryText={`by ${track.artists
                    .map((a) => a.name)
                    .toString()}`}
                  tertiaryText={`Added to ${recentlyAddedTracks[virtualItem.index].playlistName}, ${dayjs().to(dayjs(recentlyAddedTracks[virtualItem.index].added_at))}`}
                  handleClick={() => spotifyService?.playTrack(track)}
                  cover={track.album.images[0]}
                />
              </div>
            )
          })}
        </div>
      </div>}
    </div>
  );
};
