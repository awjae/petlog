'use client';

import { useState } from 'react';
import { LIFE_STAGES, dailyCalories, type LifeStage } from './dailyCalories';
import styles from '../tool.module.css';

export function DailyCaloriesCalculator() {
  const [stage, setStage] = useState<LifeStage>('dogNeutered');
  const [weight, setWeight] = useState('');
  const [foodKcal, setFoodKcal] = useState('');

  const result = dailyCalories(parseFloat(weight), stage, foodKcal ? parseFloat(foodKcal) : null);

  return (
    <>
      <div className={styles.form}>
        <div className={styles.field} role="radiogroup" aria-label="생애 단계">
          <span className={styles.label}>생애 단계</span>
          <div className={styles.options}>
            {LIFE_STAGES.map((s) => (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={stage === s.value}
                className={`${styles.option} ${stage === s.value ? styles.optionActive : ''}`}
                onClick={() => setStage(s.value)}
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
          <span className={styles.label}>사료 칼로리 (선택)</span>
          <div className={styles.inputRow}>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              className={styles.input}
              value={foodKcal}
              onChange={(e) => setFoodKcal(e.target.value)}
              placeholder="3500"
              aria-label="사료 칼로리 (kcal/kg)"
            />
            <span className={styles.unit}>kcal/kg · 사료 포장 뒷면에 있어요</span>
          </div>
        </div>
      </div>

      <div className={styles.result} aria-live="polite">
        <p className={styles.resultLabel}>하루 권장 칼로리</p>
        <p className={styles.resultValue}>{result ? `약 ${result.kcal}kcal` : '-'}</p>
        {result?.grams != null && (
          <p className={styles.resultHint}>사료로 하루 약 {result.grams}g (간식 포함)</p>
        )}
        <p className={styles.resultHint}>
          시작점이에요. 2~4주 동안 체중을 재보며 늘거나 줄면 양을 조정하세요.
        </p>
      </div>
    </>
  );
}
