'use client';

import { useState } from 'react';
import { PET_KIND_LABEL, toHumanAge, type PetKind } from './petAge';
import styles from '../tool.module.css';

const KINDS = Object.keys(PET_KIND_LABEL) as PetKind[];

export function PetAgeCalculator() {
  const [kind, setKind] = useState<PetKind>('smallDog');
  const [years, setYears] = useState('');
  const [months, setMonths] = useState('');

  const petYears = (parseInt(years, 10) || 0) + (parseInt(months, 10) || 0) / 12;
  const human = toHumanAge(kind, petYears);

  return (
    <>
      <div className={styles.form}>
        <div className={styles.field} role="radiogroup" aria-label="종류">
          <span className={styles.label}>종류</span>
          <div className={styles.options}>
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                className={`${styles.option} ${kind === k ? styles.optionActive : ''}`}
                onClick={() => setKind(k)}
              >
                {PET_KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>나이</span>
          <div className={styles.inputRow}>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="30"
              className={styles.input}
              value={years}
              onChange={(e) => setYears(e.target.value)}
              aria-label="나이 (살)"
            />
            <span className={styles.unit}>살</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="11"
              className={styles.input}
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              aria-label="나이 (개월)"
            />
            <span className={styles.unit}>개월</span>
          </div>
        </div>
      </div>

      <div className={styles.result} aria-live="polite">
        <p className={styles.resultLabel}>사람 나이로 약</p>
        <p className={styles.resultValue}>{human > 0 ? `${human}살` : '-'}</p>
        <p className={styles.resultHint}>평균적인 추정치예요. 품종·건강 상태에 따라 다릅니다.</p>
      </div>
    </>
  );
}
