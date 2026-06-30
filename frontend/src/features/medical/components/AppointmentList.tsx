'use client';

import { useRef, useState } from 'react';
import { Trash2, ChevronDown, CalendarCheck } from 'lucide-react';
import { DdayBadge } from '@/shared/components/DdayBadge';
import type { Appointment } from '../types/medical.types';
import styles from './AppointmentList.module.css';

interface AppointmentListProps {
  items: Appointment[];
  onDelete: (id: string) => void;
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: '예정',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

interface AppointmentItemProps {
  item: Appointment;
  onDelete: (id: string) => void;
}

function AppointmentItem({ item, onDelete }: AppointmentItemProps) {
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

  const isScheduled = item.status === 'SCHEDULED';

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
        className={`${styles.itemContent} ${item.status === 'COMPLETED' ? styles.itemCompleted : ''}`}
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
            <span className={styles.itemDate}>{formatDate(item.scheduledAt)}</span>
            <span className={styles.itemTitle}>{item.hospitalName}</span>
          </div>
          <div className={styles.itemRight}>
            {isScheduled ? (
              <DdayBadge dueDate={item.scheduledAt} overdueLabel="지남" />
            ) : (
              <span className={`${styles.statusBadge} ${styles[`status${item.status}`]}`}>
                {STATUS_LABEL[item.status] ?? item.status}
              </span>
            )}
            <ChevronDown
              size={16}
              className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
              aria-hidden="true"
            />
          </div>
        </div>
        <div className={`${styles.expandable} ${expanded ? styles.expandableOpen : ''}`}>
          <div className={styles.expandedContent}>
            {item.reason && (
              <p className={styles.detailRow}>
                <span className={styles.detailLabel}>방문 이유</span>
                <span className={styles.detailValue}>{item.reason}</span>
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

export function AppointmentList({ items, onDelete }: AppointmentListProps) {
  if (items.length === 0) {
    return (
      <div className={styles.empty} aria-label="예약 없음">
        <CalendarCheck
          size={48}
          strokeWidth={1.25}
          className={styles.emptyIcon}
          aria-hidden="true"
        />
        <p className={styles.emptyTitle}>예약된 병원이 없어요</p>
        <p className={styles.emptyDesc}>다음 병원 예약을 미리 기록해두세요</p>
      </div>
    );
  }

  return (
    <ul className={styles.list} aria-label="병원 예약 목록">
      {items.map((item) => (
        <li key={item.id}>
          <AppointmentItem item={item} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}
