'use client';

import styles from './ConcernsToggleRow.module.css';

interface ConcernsToggleRowProps {
  checked: boolean;
  disabled?: boolean;
  /** concerns 콘텐츠가 원래 없는 리포트일 때 caption을 이 문구로 교체한다. */
  captionOverride?: string;
  onChange: (next: boolean) => void;
}

const DEFAULT_CAPTION = '켜면 우려 사항도 함께 보여줘요';

export function ConcernsToggleRow({
  checked,
  disabled = false,
  captionOverride,
  onChange,
}: ConcernsToggleRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.textGroup}>
        <p className={styles.label}>우려 사항 포함</p>
        <p className={styles.caption}>{captionOverride ?? DEFAULT_CAPTION}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="우려 사항 포함"
        className={styles.switchWrapper}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`${styles.track} ${checked ? styles.trackOn : ''} ${
            disabled ? styles.trackDisabled : ''
          }`}
        >
          <span className={`${styles.thumb} ${checked ? styles.thumbOn : ''}`} />
        </span>
      </button>
    </div>
  );
}
