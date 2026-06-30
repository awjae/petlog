'use client';

import { useRef, useState } from 'react';
import { Trash2, ChevronDown, Syringe } from 'lucide-react';
import { DdayBadge } from '@/shared/components/DdayBadge';
import type { Vaccination } from '../types/medical.types';
import styles from './VaccinationList.module.css';

interface VaccinationListProps {
  items: Vaccination[];
  onDelete: (id: string) => void;
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

interface VaccinationItemProps {
  item: Vaccination;
  onDelete: (id: string) => void;
}

function VaccinationItem({ item, onDelete }: VaccinationItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const startX = useRef(0);
  const isSwiping = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    isSwiping.current = false;
    if (contentRef.current) contentRef.current.style.transition = 'none';
  }

  function handleTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientX - startX.current;
    if (delta < -8) {
      isSwiping.current = true;
      setSwipeOffset(Math.max(-80, delta));
    } else if (delta > 8 && swipeOffset < 0) {
      isSwiping.current = true;
      setSwipeOffset(Math.min(0, swipeOffset + delta));
    }
  }

  function handleTouchEnd() {
    if (contentRef.current) contentRef.current.style.transition = '';
    if (isSwiping.current) {
      setSwipeOffset(swipeOffset < -40 ? -80 : 0);
    } else {
      setExpanded((v) => !v);
    }
  }

  return (
    <div className={styles.itemWrapper}>
      <button
        type="button"
        className={styles.deleteBtn}
        onClick={() => onDelete(item.id)}
        aria-label="삭제"
      >
        <Trash2 size={20} strokeWidth={2} aria-hidden="true" />
      </button>
      <div
        ref={contentRef}
        className={styles.itemContent}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: 'transform 200ms ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (!isSwiping.current) setExpanded((v) => !v);
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
      >
        <div className={styles.itemRow}>
          <div className={styles.itemMeta}>
            <span className={styles.itemDate}>{formatDate(item.vaccinatedAt)}</span>
            <span className={styles.itemTitle}>{item.name}</span>
          </div>
          <div className={styles.itemRight}>
            {item.nextDueAt && <DdayBadge dueDate={item.nextDueAt} overdueLabel="접종 기한 초과" />}
            <ChevronDown
              size={16}
              className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
              aria-hidden="true"
            />
          </div>
        </div>
        <div className={`${styles.expandable} ${expanded ? styles.expandableOpen : ''}`}>
          <div className={styles.expandedContent}>
            {item.nextDueAt && (
              <p className={styles.detailRow}>
                <span className={styles.detailLabel}>다음 접종 예정일</span>
                <span className={styles.detailValue}>{formatDate(item.nextDueAt)}</span>
              </p>
            )}
            {item.memo && (
              <p className={styles.detailRow}>
                <span className={styles.detailLabel}>메모</span>
                <span className={styles.detailValue}>{item.memo}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function VaccinationList({ items, onDelete }: VaccinationListProps) {
  if (items.length === 0) {
    return (
      <div className={styles.empty} aria-label="예방접종 기록 없음">
        <Syringe size={48} strokeWidth={1.25} className={styles.emptyIcon} aria-hidden="true" />
        <p className={styles.emptyTitle}>예방접종 기록이 없어요</p>
        <p className={styles.emptyDesc}>접종 후 기록을 남겨두면 다음 접종일을 알 수 있어요</p>
      </div>
    );
  }

  return (
    <ul className={styles.list} aria-label="예방접종 목록">
      {items.map((item) => (
        <li key={item.id}>
          <VaccinationItem item={item} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}
