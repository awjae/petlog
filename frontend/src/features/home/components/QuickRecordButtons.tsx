'use client';

import Link from 'next/link';
import { Scale, Utensils, Footprints, NotebookPen, type LucideIcon } from 'lucide-react';
import styles from './QuickRecordButtons.module.css';

type RecordType = 'weight' | 'appetite' | 'activity' | 'mood';

type QuickItem = {
  Icon: LucideIcon;
  label: string;
  type: RecordType;
};

const ITEMS: QuickItem[] = [
  { Icon: Scale, label: '체중', type: 'weight' },
  { Icon: Utensils, label: '식사', type: 'appetite' },
  { Icon: Footprints, label: '산책', type: 'activity' },
  { Icon: NotebookPen, label: '메모', type: 'mood' },
];

type QuickRecordButtonsProps = {
  petId: string;
};

export function QuickRecordButtons({ petId }: QuickRecordButtonsProps) {
  return (
    <div className={styles.grid} role="group" aria-label="빠른 기록">
      {ITEMS.map((item) => (
        <Link
          key={item.type}
          href={`/records/new?petId=${petId}&type=${item.type}`}
          className={styles.btn}
          aria-label={`${item.label} 기록하기`}
        >
          <item.Icon size={24} strokeWidth={1.5} className={styles.icon} />
          <span className={styles.label}>{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
