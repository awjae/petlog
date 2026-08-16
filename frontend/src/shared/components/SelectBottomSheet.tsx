'use client';

import { Check, X } from 'lucide-react';
import { BottomSheet } from '@/shared/components/BottomSheet';
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
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} label={title} maxHeight="75dvh">
      {({ close }) => (
        <>
          <header className={styles.header}>
            <span className={styles.title}>{title}</span>
            <button type="button" className={styles.closeBtn} onClick={close} aria-label="닫기">
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
                  onClick={() => {
                    onChange(opt.value);
                    close();
                  }}
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
        </>
      )}
    </BottomSheet>
  );
}
