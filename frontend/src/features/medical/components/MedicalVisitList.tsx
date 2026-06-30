'use client';

import { useRef, useState } from 'react';
import { Trash2, ChevronDown, Hospital } from 'lucide-react';
import type { MedicalEvent } from '../types/medical.types';
import styles from './MedicalVisitList.module.css';

interface MedicalVisitListProps {
  items: MedicalEvent[];
  onDelete: (id: string) => void;
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

interface VisitItemProps {
  item: MedicalEvent;
  onDelete: (id: string) => void;
}

function VisitItem({ item, onDelete }: VisitItemProps) {
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
            <span className={styles.itemDate}>{formatDate(item.visitDate)}</span>
            <span className={styles.itemTitle}>{item.hospitalName}</span>
          </div>
          <ChevronDown
            size={16}
            className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
            aria-hidden="true"
          />
        </div>
        <div className={`${styles.expandable} ${expanded ? styles.expandableOpen : ''}`}>
          {item.description && item.description !== '-' && (
            <p className={styles.description}>{item.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function MedicalVisitList({ items, onDelete }: MedicalVisitListProps) {
  if (items.length === 0) {
    return (
      <div className={styles.empty} aria-label="방문 기록 없음">
        <Hospital size={48} strokeWidth={1.25} className={styles.emptyIcon} aria-hidden="true" />
        <p className={styles.emptyTitle}>방문 기록이 없어요</p>
        <p className={styles.emptyDesc}>병원 방문 후 기록을 남겨보세요</p>
      </div>
    );
  }

  return (
    <ul className={styles.list} aria-label="병원 방문 목록">
      {items.map((item) => (
        <li key={item.id}>
          <VisitItem item={item} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}
