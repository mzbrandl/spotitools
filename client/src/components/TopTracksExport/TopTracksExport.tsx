import React, { useState, useEffect } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { css } from '@emotion/react'
import styles from "./TopTracksExport.module.scss";
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from "@mui/material/Switch";
import { alpha, styled } from '@mui/material/styles';


const GreenSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: "#1DD15D",
    '&:hover': {
      backgroundColor: alpha("#1DD15D", theme.palette.action.hoverOpacity),
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: "#1DD15D",
  },
  '&  .MuiSwitch-track': {
    backgroundColor: "#5F5F5F",
  },

}));

export const TopTracksExport = () => {
  const [isSubscribed, setIsSubscribed] = useState<boolean | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSwitchDisabled, setIsSwitchDisabled] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch("/monthly_export").then(res => res.json().then(value => {
      setIsSubscribed(value.result);
      setIsLoading(false);
    }))
  }, [])

  const onSwitchClick = () => {
    setIsSwitchDisabled(true);
    if (isSubscribed) {
      fetch("/unsubscribe_monthly_export", {
        method: "put",
        headers: { 'Content-Type': 'application/json' },
      }).then(res => {
        setIsSubscribed(!isSubscribed)
        setIsSwitchDisabled(false)
      })
    } else {
      fetch("/subscribe_monthly_export", {
        method: "put",
        headers: { 'Content-Type': 'application/json' },
      }).then(res => {
        setIsSubscribed(!isSubscribed)
        setIsSwitchDisabled(false)
      })
    }
  }

  return (
    <div className={styles.topTracksExport}>
      <p>
        Subscribe to have your monthly top songs exported as a playlist.
      </p>

      {isLoading ?
        <div className={styles.loadingPlaylists}>
          <ClipLoader
            cssOverride={{alignSelf: 'center'}}
            size={30}
            color={"#1db954"}
            loading={true}
          />
          <span>Loading...</span>
        </div>
        : <div className={styles.switch}>
          <FormControlLabel control={<GreenSwitch onClick={onSwitchClick} checked={isSubscribed} disabled={isSwitchDisabled} />} label="Subscribe" />
        </div>
      }
    </div>
  );
};
