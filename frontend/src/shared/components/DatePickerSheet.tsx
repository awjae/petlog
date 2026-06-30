'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './DatePickerSheet.module.css';

const ITEM_H = 44;
const PAD_H = ITEM_H * 2; // 2 invisible rows above and below

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function getYears(min?: string, max?: string): string[] {
  const now = new Date().getFullYear();
  const minY = min ? parseInt(min.slice(0, 4)) : now - 5;
  const maxY = max ? parseInt(max.slice(0, 4)) : now + 5;
  return Array.from({ length: maxY - minY + 1 }, (_, i) => String(minY + i));
}

function getMonths(year: string, min?: string, max?: string): string[] {
  return Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).filter((m) => {
    const ym = `${year}-${m}`;
    if (min && ym < min.slice(0, 7)) return false;
    if (max && ym > max.slice(0, 7)) return false;
    return true;
  });
}

function getDays(year: string, month: string, min?: string, max?: string): string[] {
  const count = new Date(parseInt(year), parseInt(month), 0).getDate();
  return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, '0')).filter((d) => {
    const ymd = `${year}-${month}-${d}`;
    if (min && ymd < min) return false;
    if (max && ymd > max) return false;
    return true;
  });
}

function clampToList(value: string, list: string[]): string {
  if (list.includes(value)) return value;
  if (list.length === 0) return '';
  if (value < list[0]) return list[0];
  return list[list.length - 1];
}

interface DrumColumnProps {
  items: string[];
  labels?: string[];
  value: string;
  onChange: (v: string) => void;
  unit: string;
}

function DrumColumn({ items, labels, value, onChange, unit }: DrumColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolling = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function syncScroll(val: string, instant = false) {
    const el = scrollRef.current;
    if (!el) return;
    const idx = items.indexOf(val);
    if (idx < 0) return;
    const top = idx * ITEM_H;
    if (instant) {
      el.scrollTop = top;
    } else {
      el.scrollTo({ top, behavior: 'smooth' });
    }
  }

  useEffect(() => {
    syncScroll(value, true);
  }, []);

  useEffect(() => {
    if (!userScrolling.current) syncScroll(value);
  }, [value, items]);

  function onScroll() {
    userScrolling.current = true;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      userScrolling.current = false;
      const el = scrollRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      if (items[clamped] !== value) onChange(items[clamped]);
    }, 120);
  }

  return (
    <div className={styles.column}>
      <div ref={scrollRef} className={styles.columnScroll} onScroll={onScroll}>
        <div style={{ height: PAD_H, flexShrink: 0 }} />
        {items.map((item, i) => (
          <div
            key={item}
            className={`${styles.columnItem} ${item === value ? styles.columnItemActive : ''}`}
          >
            {labels ? labels[i] : item}
            <span className={styles.unit}>{unit}</span>
          </div>
        ))}
        <div style={{ height: PAD_H, flexShrink: 0 }} />
      </div>
      <div className={styles.highlight} aria-hidden="true" />
      <div className={styles.fadeTop} aria-hidden="true" />
      <div className={styles.fadeBottom} aria-hidden="true" />
    </div>
  );
}

export interface DatePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  title?: string;
}

export function DatePickerSheet({
  isOpen,
  onClose,
  value,
  onChange,
  min,
  max,
  title = '날짜 선택',
}: DatePickerSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const initial = value || today();
  const [year, setYear] = useState(initial.slice(0, 4));
  const [month, setMonth] = useState(initial.slice(5, 7));
  const [day, setDay] = useState(initial.slice(8, 10));

  const years = getYears(min, max);
  const months = getMonths(year, min, max);
  const days = getDays(year, month, min, max);

  useEffect(() => {
    const clamped = clampToList(month, months);
    if (clamped !== month && clamped) setMonth(clamped);
  }, [year]);

  useEffect(() => {
    const clamped = clampToList(day, days);
    if (clamped !== day && clamped) setDay(clamped);
  }, [year, month]);

  useEffect(() => {
    if (isOpen) {
      const src = value || today();
      setYear(src.slice(0, 4));
      setMonth(src.slice(5, 7));
      setDay(src.slice(8, 10));
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 310);
      return () => clearTimeout(t);
    }
  }, [isOpen, value]);

  function handleConfirm() {
    onChange(`${year}-${month}-${day}`);
    setVisible(false);
    setTimeout(onClose, 310);
  }

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 310);
  }

  if (!mounted) return null;

  return (
    <div className={`${styles.root} ${visible ? styles.rootVisible : ''}`}>
      <div className={styles.overlay} onClick={handleClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`${styles.sheet} ${visible ? styles.sheetVisible : ''}`}
      >
        <div className={styles.dragHandleArea}>
          <div className={styles.dragHandle} aria-hidden="true" />
        </div>
        <header className={styles.header}>
          <button type="button" className={styles.cancelBtn} onClick={handleClose}>
            취소
          </button>
          <span className={styles.title}>{title}</span>
          <button type="button" className={styles.confirmBtn} onClick={handleConfirm}>
            확인
          </button>
        </header>

        <div className={styles.pickerRow}>
          <DrumColumn items={years} value={year} onChange={setYear} unit="년" />
          <DrumColumn items={months} value={month} onChange={setMonth} unit="월" />
          <DrumColumn items={days} value={day} onChange={setDay} unit="일" />
        </div>
      </div>
    </div>
  );
}

export function formatDateKo(value: string): string {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
}
