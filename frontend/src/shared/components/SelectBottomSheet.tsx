'use client';

import { useRef } from 'react';
import { Check, X } from 'lucide-react';
import { useOverlayDismiss } from '@/shared/hooks/useOverlayDismiss';
import { useSheetTransition } from '@/shared/hooks/useSheetTransition';
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
  const sheetRef = useRef<HTMLDivElement>(null);
  const { mounted, visible, close: handleClose } = useSheetTransition(isOpen, onClose);

  useOverlayDismiss(isOpen, handleClose);

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
