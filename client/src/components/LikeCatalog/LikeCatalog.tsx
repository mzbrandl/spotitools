import React, { useState, useContext, useEffect, useMemo } from "react";
import { ClipLoader } from "react-spinners";
import { css } from '@emotion/react'
import { likedTracksAtom, likedTracksFilteredAtom, playlistsAndTracksAtom, SpotifyServiceContext } from "../../App";
import { ListResult } from "../ListResult/ListResult";
import styles from "./LikeCatalog.module.scss";
import { useAtom } from "jotai";
import SpotifyService from "../../services/SpotifyService";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ReactComponent as ThreeDots } from "../../assets/add-music.svg";
import { AddModal } from "../AddModal/AddModal";

export const LikeCatalog = () => {
  const spotifyService = useContext(SpotifyServiceContext);
  const [playlistsAndTracks] = useAtom(playlistsAndTracksAtom)
  const [likedTracks] = useAtom(likedTracksAtom)
  const [likedTracksFiltered, setLikedTracksFiltered] = useAtom(likedTracksFilteredAtom)
  const [isFiltering, setIsFiltering] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false)
  const [trackUri, setTrackUri] = useState("");

  const parentRef = React.useRef(null)
  const paragraphRef = React.useRef<HTMLParagraphElement>(null)
  const [listHeight, setListHeight] = useState(200)

  useEffect(() => {
    if (likedTracks && !likedTracksFiltered) {
      setIsFiltering(true);
      (async () => {
        const likedTracksFiltered = likedTracks
          ?.filter(likedTrack => !playlistsAndTracks
            ?.some(playlist => playlist.items
              .some(playlistTrack => SpotifyService.isSameTrack(likedTrack.track as SpotifyApi.TrackObjectFull, playlistTrack.track as SpotifyApi.TrackObjectFull))))
        setLikedTracksFiltered(likedTracksFiltered);
      })();
      setIsFiltering(false);
    }
  }, [likedTracks])

  const rowVirtualizer = useVirtualizer({
    count: likedTracksFiltered ? likedTracksFiltered.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 94,
  })

  useEffect(() => {
    check()
  }, [paragraphRef, likedTracksFiltered])

  const check = () => {
    if (!!paragraphRef.current) {
      let { bottom } = paragraphRef.current.getBoundingClientRect()
      setListHeight(window.innerHeight - bottom - 20)
    }
  }

  if (showAddModal) {
    return <AddModal trackUri={trackUri} onClose={() => setShowAddModal(false)} />
  }

  return (
    <div className={styles.likeCatalog}>
      <p ref={paragraphRef}>
        Your liked songs which you haven't added to any playlist ... yet.
        {likedTracksFiltered && <><br /><b>Count: {likedTracksFiltered.length}</b></>}
      </p>
      {!!likedTracksFiltered ? <div
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
            const track = likedTracksFiltered[virtualItem.index].track as SpotifyApi.TrackObjectFull;
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
                  cover={track.album.images[0]}
                  handleClick={() => spotifyService?.playTrack(track)}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <ThreeDots
                      width={32}
                      height={32}
                      style={{ fill: "white", padding: "6px 3px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTrackUri(track.uri)
                        setShowAddModal(true)
                      }}
                    />
                  </div>
                </ListResult>
              </div>
            )
          })}
        </div>
      </div>
        : <div className={styles.loadingPlaylists}>
          <ClipLoader
            cssOverride={{alignSelf: 'center'}}
            size={30}
            color={"#1db954"}
            loading={true}
          />
          <span>Scanning liked songs...</span>
        </div>}
    </div>
  );
};
