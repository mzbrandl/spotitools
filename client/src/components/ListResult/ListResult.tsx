import React from "react";
import * as CheckMark from "../../assets/checkmark_green.png";
import styles from "./ListResult.module.scss";

export interface IListResultProps {
  id: string;
  title: string;
  cover?: SpotifyApi.ImageObject;
  secondaryText?: string;
  tertiaryText?: string;
  isChecked?: boolean;
  handleClick?(id: string, isChecked: boolean): void;
  children?: React.ReactNode;
}

export const ListResult: React.FC<IListResultProps> = ({
  id,
  title,
  secondaryText,
  tertiaryText,
  cover,
  isChecked,
  handleClick,
  children
}: IListResultProps) => {
  return (
    <div
      className={styles.listResult}
      style={handleClick && { cursor: "pointer" }}
      onClick={(_e) => handleClick && handleClick(id, !isChecked)}>
      <div className={styles.overlay}>
        <img
          className={styles.cover}
          src={cover?.url ?? ""}
          alt="cover"
          height={60}
          width={60}
        />
        <div className={styles.textWrapper}>
          <h5>{title}</h5>
          {secondaryText && (
            <div className={styles.subInfo}>
              <p>{secondaryText}</p>
            </div>
          )}
          {tertiaryText && (
            <div className={styles.subInfo}>
              <p>{tertiaryText}</p>
            </div>
          )}
        </div>
        {children}
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



