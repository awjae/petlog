'use client';

import { useState } from 'react';
import type { HealthRecordType } from '@/generated/graphql';
import { TYPE_LABEL, buildSummary } from '../types/health-record.types';
import type { HealthRecord } from '../types/health-record.types';
import styles from './HealthRecordTimeline.module.css';

type Props = {
  records: HealthRecord[];
};

const ALL_TYPES = Object.keys(TYPE_LABEL) as HealthRecordType[];

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.setHours(0, 0, 0, 0) - new Date(d.toDateString()).getTime();
  const days = diff / 86400000;
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function getDateKey(iso: string): string {
  return iso.split('T')[0];
}

function groupByDate(records: HealthRecord[]): [string, HealthRecord[]][] {
  const map = new Map<string, HealthRecord[]>();
  for (const r of records) {
    const key = getDateKey(r.recordedAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries());
}

export function HealthRecordTimeline({ records }: Props) {
  const [activeType, setActiveType] = useState<HealthRecordType | null>(null);

  const filtered = activeType ? records.filter((r) => r.type === activeType) : records;
  const grouped = groupByDate(filtered);

  return (
    <div className={styles.container}>
      {/* 타입 필터 칩 */}
      <div className={styles.filterBar} role="group" aria-label="기록 유형 필터">
        <button
          type="button"
          className={`${styles.chip} ${activeType === null ? styles.chipActive : ''}`}
          onClick={() => setActiveType(null)}
        >
          전체
        </button>
        {ALL_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={`${styles.chip} ${activeType === type ? styles.chipActive : ''}`}
            onClick={() => setActiveType(activeType === type ? null : type)}
          >
            {TYPE_LABEL[type]}
          </button>
        ))}
      </div>

      {/* 기록 없음 */}
      {filtered.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            {activeType ? `${TYPE_LABEL[activeType]} 기록이 없어요` : '아직 기록이 없어요'}
          </p>
        </div>
      )}

      {/* 날짜별 그룹 */}
      <div className={styles.timeline}>
        {grouped.map(([dateKey, dayRecords]) => (
          <div key={dateKey} className={styles.dateGroup}>
            <h2 className={styles.dateLabel}>{formatDateLabel(dayRecords[0].recordedAt)}</h2>
            <ul className={styles.recordList}>
              {dayRecords.map((record) => (
                <li key={record.id} className={styles.recordCard}>
                  <div className={styles.cardTop}>
                    <span className={styles.typeBadge}>{TYPE_LABEL[record.type]}</span>
                    <span className={styles.time}>{formatTime(record.recordedAt)}</span>
                  </div>
                  <p className={styles.summary}>
                    {buildSummary(record.type, record.numValue, record.textValue)}
                  </p>
                  {record.note && <p className={styles.note}>{record.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
