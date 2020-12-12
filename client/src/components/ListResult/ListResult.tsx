import React from "react";
import * as CheckMark from "../../assets/checkmark_green.png";
import styles from "./ListResult.module.scss";

export interface IListResultProps {
  id: string;
  title: string;
  cover: SpotifyApi.ImageObject;
  author?: string | string[];
  isChecked?: boolean;
  handelClick?(id: string, isChecked: boolean): void;
}

export const ListResult = ({
  id,
  title,
  author,
  cover,
  isChecked,
  handelClick,
}: IListResultProps) => {
  return (
    <div
      className={styles.listResult}
      onClick={(_e) => handelClick && handelClick(id, !isChecked)}
    >
      <div className={styles.overlay}>
        <img
          className={styles.cover}
          src={cover?.url}
          alt="cover"
          height={60}
          width={60}
        ></img>
        <div className={styles.textWrapper}>
          <h5>{title}</h5>
          {author && (
            <div className={styles.subInfo}>
              <p>by {author.toString()} </p>
            </div>
          )}
        </div>
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
