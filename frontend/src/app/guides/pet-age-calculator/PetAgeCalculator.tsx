'use client';

import { useState } from 'react';
import { toHumanAge, type PetKind } from './petAge';
import styles from './calculator.module.css';

const KIND_OPTIONS: Array<{ value: PetKind; label: string }> = [
  { value: 'dog-small', label: '소형견 (10kg 미만)' },
  { value: 'dog-medium', label: '중형견 (10~25kg)' },
  { value: 'dog-large', label: '대형견 (25kg 이상)' },
  { value: 'cat', label: '고양이' },
];

export function PetAgeCalculator() {
  const [kind, setKind] = useState<PetKind>('dog-small');
  const [years, setYears] = useState('3');
  const [months, setMonths] = useState('0');

  const totalMonths = Number(years || 0) * 12 + Number(months || 0);
  const valid = Number.isFinite(totalMonths) && totalMonths > 0 && totalMonths <= 30 * 12;

  return (
    <section className={styles.calculator} aria-label="나이 계산기">
      <label className={styles.field}>
        <span className={styles.label}>종류</span>
        <select
          className={styles.input}
          value={kind}
          onChange={(e) => setKind(e.target.value as PetKind)}
        >
          {KIND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>나이(년)</span>
          <input
            className={styles.input}
            type="number"
            inputMode="numeric"
            min={0}
            max={30}
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>개월</span>
          <input
            className={styles.input}
            type="number"
            inputMode="numeric"
            min={0}
            max={11}
            value={months}
            onChange={(e) => setMonths(e.target.value)}
          />
        </label>
      </div>

      <p className={styles.result} aria-live="polite">
        {valid ? (
          <>
            사람 나이로 약 <strong>{toHumanAge(kind, totalMonths)}세</strong>예요
          </>
        ) : (
          '나이를 입력해주세요 (최대 30년)'
        )}
      </p>
    </section>
  );
}
