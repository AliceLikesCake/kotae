"use client";

import { useT } from "../i18n/client";
import { nextInterval, RATINGS, type Rating } from "../lib/review";
import styles from "./review.module.css";

// 忘記 / 模糊 / 記得，底下顯示下次複習時間。有 selected 時會標出目前選的
export default function RatingButtons({
  interval,
  selected,
  onSelect,
  disabled,
}: {
  interval: number;
  selected?: Rating;
  onSelect: (rating: Rating) => void;
  disabled?: boolean;
}) {
  const t = useT();
  return (
    <div className={styles.ratings}>
      {RATINGS.map((rating) => {
        const isSelected = selected === rating;
        return (
          <button
            key={rating}
            type="button"
            className={`${styles.rating} ${styles[rating]}`}
            aria-pressed={selected ? isSelected : undefined}
            onClick={() => onSelect(rating)}
            disabled={disabled}
          >
            <span className={styles.ratingName}>
              {t.ratings[rating]}
              {isSelected && " ✓"}
            </span>
            <span className={styles.ratingWhen}>{t.nextReview(nextInterval(interval, rating), rating)}</span>
          </button>
        );
      })}
    </div>
  );
}
