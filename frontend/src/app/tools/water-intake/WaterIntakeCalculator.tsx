'use client';

import { useState } from 'react';
import { waterIntake, type WaterSpecies } from './waterIntake';
import styles from '../tool.module.css';

const SPECIES: { value: WaterSpecies; label: string }[] = [
  { value: 'dog', label: '강아지' },
  { value: 'cat', label: '고양이' },
];

export function WaterIntakeCalculator() {
  const [species, setSpecies] = useState<WaterSpecies>('dog');
  const [weight, setWeight] = useState('');
  const [measured, setMeasured] = useState('');

  const result = waterIntake(species, parseFloat(weight), measured ? parseFloat(measured) : null);

  return (
    <>
      <div className={styles.form}>
        <div className={styles.field} role="radiogroup" aria-label="종류">
          <span className={styles.label}>종류</span>
          <div className={styles.options}>
            {SPECIES.map((s) => (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={species === s.value}
                className={`${styles.option} ${species === s.value ? styles.optionActive : ''}`}
                onClick={() => setSpecies(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>체중</span>
          <div className={styles.inputRow}>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              className={styles.input}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              aria-label="체중 (kg)"
            />
            <span className={styles.unit}>kg</span>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>오늘 마신 양 (선택)</span>
          <div className={styles.inputRow}>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="10"
              className={styles.input}
              value={measured}
              onChange={(e) => setMeasured(e.target.value)}
              aria-label="마신 양 (mL)"
            />
            <span className={styles.unit}>mL</span>
          </div>
        </div>
      </div>

      <div className={styles.result} aria-live="polite">
        {result ? (
          <>
            <p className={styles.resultLabel}>평소 하루 음수량</p>
            <p className={styles.resultValue}>
              {result.typical.min}~{result.typical.max}mL
            </p>
            <p className={styles.resultHint}>
              하루 {result.high}mL(1kg당 {result.highPerKg}mL)를 넘는 날이 이어지면 많이 마시는
              편이에요.
            </p>
            {result.measuredPerKg != null && (
              <p className={styles.resultHint} role={result.isHigh ? 'note' : undefined}>
                오늘은 1kg당 {result.measuredPerKg}mL
                {result.isHigh
                  ? ' — 기준보다 많아요. 며칠 이어지면 수의사와 상담해보세요.'
                  : ' — 많이 마시는 기준 아래예요.'}
              </p>
            )}
          </>
        ) : (
          <p className={styles.resultValue}>-</p>
        )}
      </div>
    </>
  );
}
