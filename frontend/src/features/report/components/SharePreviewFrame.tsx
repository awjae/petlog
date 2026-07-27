'use client';

import { AlertCircle, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { ReportShareMasthead } from './ReportShareMasthead';
import styles from './SharePreviewFrame.module.css';

/**
 * 공유 이미지 미리보기.
 *
 * data-mode="light"로 명암을 고정한다(결정 문서: .claude/docs/decisions/030-design-token-roles-and-theme-mode.md).
 * 실제로 만들어지는 이미지가 라이트 고정이라
 * (features/report/utils/shareImage.ts), 미리보기가 다크면 "보이는 것과 나가는 것"이
 * 달라진다. 팔레트(스카이/핑크)는 사용자가 고른 것을 그대로 따른다.
 */
type SharePreviewFrameState = 'loading' | 'error' | 'ready';

interface SharePreviewFrameReadyData {
  petName: string;
  periodStart: string;
  periodEnd: string;
  overview: string | null;
  highlights: string[];
  recommendations: string[];
  /** 토글이 켜져 있고 원본 리포트에 우려 사항이 있을 때만 전달한다. */
  concerns?: string[];
}

interface SharePreviewFrameProps {
  state: SharePreviewFrameState;
  data?: SharePreviewFrameReadyData;
  onRetry?: () => void;
}

const MAX_PREVIEW_ITEMS = 2;

function summarize(items: string[]): { shown: string[]; extra: number } {
  return {
    shown: items.slice(0, MAX_PREVIEW_ITEMS),
    extra: Math.max(0, items.length - MAX_PREVIEW_ITEMS),
  };
}

function PreviewSection({
  icon,
  label,
  items,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  tone: 'highlights' | 'concerns' | 'recommendations';
}) {
  if (items.length === 0) return null;
  const { shown, extra } = summarize(items);

  return (
    <div className={`${styles.section} ${styles[`section_${tone}`]}`}>
      <div className={styles.sectionHeader}>
        {icon}
        <span className={styles.sectionLabel}>{label}</span>
      </div>
      <ul className={styles.sectionList}>
        {shown.map((item, i) => (
          <li key={i} className={styles.sectionItem}>
            {item}
          </li>
        ))}
      </ul>
      {extra > 0 && <p className={styles.sectionMore}>외 {extra}건</p>}
    </div>
  );
}

export function SharePreviewFrame({ state, data, onRetry }: SharePreviewFrameProps) {
  if (state === 'loading') {
    return (
      <div
        className={styles.frame}
        data-mode="light"
        aria-label="미리보기 로딩 중"
        aria-busy="true"
      >
        <div className={styles.shimmerBlock} style={{ height: 78 }} />
        <div className={styles.shimmerBlock} style={{ height: 64, marginTop: 12 }} />
        <div className={styles.shimmerBlock} style={{ height: 72, marginTop: 10 }} />
        <div className={styles.shimmerBlock} style={{ height: 72, marginTop: 10 }} />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={styles.frame} data-mode="light">
        <div className={styles.errorState} role="alert">
          <AlertCircle size={22} strokeWidth={2} className={styles.errorIcon} aria-hidden="true" />
          <p className={styles.errorText}>미리보기를 불러오지 못했어요</p>
          {onRetry && (
            <button type="button" className={styles.retryBtn} onClick={onRetry}>
              다시 시도
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={styles.frame} data-mode="light" aria-live="polite">
      <ReportShareMasthead
        petName={data.petName}
        periodStart={data.periodStart}
        periodEnd={data.periodEnd}
      />

      {data.overview && <p className={styles.overview}>{data.overview}</p>}

      <div className={styles.sections}>
        <PreviewSection
          icon={<TrendingUp size={15} strokeWidth={1.75} aria-hidden="true" />}
          label="주요 변화"
          items={data.highlights}
          tone="highlights"
        />
        {data.concerns && data.concerns.length > 0 && (
          <PreviewSection
            icon={<AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />}
            label="우려 사항"
            items={data.concerns}
            tone="concerns"
          />
        )}
        <PreviewSection
          icon={<Lightbulb size={15} strokeWidth={1.75} aria-hidden="true" />}
          label="관리 팁"
          items={data.recommendations}
          tone="recommendations"
        />
      </div>

      <span className={styles.viewerPill}>다른 사람이 볼 화면</span>
    </div>
  );
}
