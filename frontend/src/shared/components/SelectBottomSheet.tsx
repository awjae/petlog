'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import styles from './SelectBottomSheet.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
}

export function SelectBottomSheet({
  isOpen,
  onClose,
  title,
  options,
  value,
  onChange,
}: SelectBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 310);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 310);
  }

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    handleClose();
  }

  if (!mounted) return null;

  return (
    <div className={`${styles.root} ${visible ? styles.rootVisible : ''}`}>
      <div className={styles.overlay} onClick={handleClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`${styles.sheet} ${visible ? styles.sheetVisible : ''}`}
      >
        <div className={styles.dragHandleArea}>
          <div className={styles.dragHandle} aria-hidden="true" />
        </div>
        <header className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="닫기">
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>
        <ul className={styles.list} role="listbox" aria-label={title}>
          {options.map((opt) => (
            <li key={opt.value} role="none">
              <button
                type="button"
                role="option"
                aria-selected={value === opt.value}
                className={`${styles.option} ${value === opt.value ? styles.optionSelected : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                <span className={styles.optionLabel}>{opt.label}</span>
                {value === opt.value && (
                  <Check
                    size={18}
                    strokeWidth={2.5}
                    className={styles.checkIcon}
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
