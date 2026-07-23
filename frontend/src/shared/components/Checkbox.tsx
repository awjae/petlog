'use client';

import { Check } from 'lucide-react';
import styles from './Checkbox.module.css';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaRequired?: boolean;
  disabled?: boolean;
}

/**
 * 프로젝트 최초 도입 체크박스 컴포넌트.
 * 실제 접근성은 <input type="checkbox">가 담당하고, 시각적 박스는 aria-hidden 처리한다.
 * 라벨 연결은 호출부에서 <label htmlFor={id}>로 감싸는 방식을 전제로 한다.
 */
export function Checkbox({ id, checked, onChange, ariaRequired, disabled }: CheckboxProps) {
  return (
    <span className={styles.wrapper}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-required={ariaRequired ? 'true' : undefined}
        disabled={disabled}
        className={styles.input}
      />
      <span className={`${styles.box} ${checked ? styles.boxChecked : ''}`} aria-hidden="true">
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
    </span>
  );
}
