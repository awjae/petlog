'use client';

import { useRef, useState } from 'react';
import { Trash2, ChevronDown, Pill } from 'lucide-react';
import type { Medication } from '../types/medication.types';
import styles from './MedicationList.module.css';

interface MedicationListProps {
  items: Medication[];
  onDelete: (id: string) => void;
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function isActive(item: Medication): boolean {
  const now = new Date();
  const start = new Date(item.startDate);
  if (start > now) return false;
  if (!item.endDate) return true;
  return new Date(item.endDate) >= now;
}

interface MedicationItemProps {
  item: Medication;
  onDelete: (id: string) => void;
}

function MedicationItem({ item, onDelete }: MedicationItemProps) {
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

  const active = isActive(item);

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
        className={`${styles.itemContent} ${!active ? styles.itemInactive : ''}`}
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
            <div className={styles.itemTitleRow}>
              <span className={styles.itemTitle}>{item.name}</span>
              {active && (
                <span className={styles.activeBadge} aria-label="투약 중">
                  투약 중
                </span>
              )}
            </div>
            <span className={styles.itemSub}>
              {item.frequency} · {formatDate(item.startDate)}부터
            </span>
          </div>
          <ChevronDown
            size={16}
            className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
            aria-hidden="true"
          />
        </div>
        <div className={`${styles.expandable} ${expanded ? styles.expandableOpen : ''}`}>
          <div className={styles.expandedContent}>
            <p className={styles.detailRow}>
              <span className={styles.detailLabel}>시작일</span>
              <span className={styles.detailValue}>{formatDate(item.startDate)}</span>
            </p>
            {item.endDate && (
              <p className={styles.detailRow}>
                <span className={styles.detailLabel}>종료일</span>
                <span className={styles.detailValue}>{formatDate(item.endDate)}</span>
              </p>
            )}
            <p className={styles.detailRow}>
              <span className={styles.detailLabel}>투약 주기</span>
              <span className={styles.detailValue}>{item.frequency}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MedicationList({ items, onDelete }: MedicationListProps) {
  if (items.length === 0) {
    return (
      <div className={styles.empty} aria-label="투약 기록 없음">
        <Pill size={48} strokeWidth={1.25} className={styles.emptyIcon} aria-hidden="true" />
        <p className={styles.emptyTitle}>투약 기록이 없어요</p>
        <p className={styles.emptyDesc}>현재 투여 중인 약을 기록해두세요</p>
      </div>
    );
  }

  return (
    <ul className={styles.list} aria-label="투약 목록">
      {items.map((item) => (
        <li key={item.id}>
          <MedicationItem item={item} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}
