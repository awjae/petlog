'use client';

import { TrendingUp, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
import styles from './ReportDetailSection.module.css';

export type ReportSectionType = 'highlights' | 'concerns' | 'recommendations';

interface ReportDetailSectionProps {
  type: ReportSectionType;
  content: string | string[] | null;
  order: number;
}

const SECTION_META: Record<ReportSectionType, { label: string; icon: React.ReactNode }> = {
  highlights: {
    label: '주요 변화',
    icon: <TrendingUp size={18} strokeWidth={1.75} aria-hidden="true" />,
  },
  concerns: {
    label: '우려 사항',
    icon: <AlertTriangle size={18} strokeWidth={1.75} aria-hidden="true" />,
  },
  recommendations: {
    label: '관리 팁',
    icon: <Lightbulb size={18} strokeWidth={1.75} aria-hidden="true" />,
  },
};

/** concerns는 콘텐츠가 없어도 "특별한 우려 사항이 없어요" 카드로 항상 노출된다. */
export function isSectionVisible(
  type: ReportSectionType,
  content: string | string[] | null,
): boolean {
  if (type === 'concerns') return true;
  return Array.isArray(content) ? content.length > 0 : !!content;
}

function renderContent(type: ReportSectionType, content: string | string[] | null) {
  if (type === 'concerns') {
    const isEmpty = !content || (Array.isArray(content) && content.length === 0);
    if (isEmpty) {
      return (
        <div className={styles.noConcerns}>
          <CheckCircle
            size={16}
            strokeWidth={2}
            className={styles.noConcernsIcon}
            aria-hidden="true"
          />
          <span>특별한 우려 사항이 없어요</span>
        </div>
      );
    }
  }

  if (!content) return null;

  if (typeof content === 'string') {
    return <p className={styles.text}>{content}</p>;
  }

  return (
    <ul className={styles.list}>
      {content.map((item, i) => (
        <li key={i} className={styles.listItem}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ReportDetailSection({ type, content, order }: ReportDetailSectionProps) {
  if (!isSectionVisible(type, content)) return null;

  const meta = SECTION_META[type];
  const isConcernsEmpty =
    type === 'concerns' && (!content || (Array.isArray(content) && content.length === 0));

  return (
    <section
      className={`${styles.section} ${styles[`section_${type}`]} ${isConcernsEmpty ? styles.sectionConcernsEmpty : ''}`}
      aria-label={meta.label}
    >
      <div className={`${styles.iconWrap} ${styles[`iconWrap_${type}`]}`}>{meta.icon}</div>
      <div className={styles.body}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.orderChip} aria-hidden="true">
            {order}
          </span>
          {meta.label}
        </h2>
        {renderContent(type, content)}
      </div>
    </section>
  );
}
