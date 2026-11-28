'use client';

import { useState } from 'react';
import { dailyCalories, dailyFoodGrams, type LifeStage } from './petCalorie';
import styles from './calculator.module.css';

const STAGE_OPTIONS: Array<{ value: LifeStage; label: string }> = [
  { value: 'dog-neutered', label: '강아지 · 중성화한 성견' },
  { value: 'dog-intact', label: '강아지 · 중성화하지 않은 성견' },
  { value: 'dog-weight-loss', label: '강아지 · 체중 감량 중' },
  { value: 'dog-puppy-young', label: '강아지 · 4개월 미만' },
  { value: 'dog-puppy', label: '강아지 · 4개월 ~ 1살' },
  { value: 'cat-neutered', label: '고양이 · 중성화한 성묘' },
  { value: 'cat-intact', label: '고양이 · 중성화하지 않은 성묘' },
  { value: 'cat-weight-loss', label: '고양이 · 체중 감량 중' },
  { value: 'cat-kitten', label: '고양이 · 1살 미만' },
];

export function PetCalorieCalculator() {
  const [stage, setStage] = useState<LifeStage>('dog-neutered');
  const [weight, setWeight] = useState('5');
  const [foodKcal, setFoodKcal] = useState('');

  const weightKg = Number(weight);
  const validWeight = weightKg > 0 && weightKg <= 100;
  const kcal = validWeight ? dailyCalories(weightKg, stage) : null;
  const foodKcalPerKg = Number(foodKcal);
  const grams = kcal && foodKcalPerKg > 0 ? dailyFoodGrams(kcal, foodKcalPerKg) : null;

  return (
    <section className={styles.calculator} aria-label="칼로리 계산기">
      <label className={styles.field}>
        <span className={styles.label}>상태</span>
        <select
          className={styles.input}
          value={stage}
          onChange={(e) => setStage(e.target.value as LifeStage)}
        >
          {STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>현재 체중(kg)</span>
          <input
            className={styles.input}
            type="number"
            inputMode="decimal"
            min={0}
            step={0.1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>사료 열량(kcal/kg, 선택)</span>
          <input
            className={styles.input}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="예: 3500"
            value={foodKcal}
            onChange={(e) => setFoodKcal(e.target.value)}
          />
        </label>
      </div>

      <p className={styles.result} aria-live="polite">
        {kcal ? (
          <>
            하루 약 <strong>{kcal.toLocaleString()}kcal</strong>
            {grams && (
              <>
                {' '}
                · 사료 약 <strong>{grams.toLocaleString()}g</strong>
              </>
            )}
          </>
        ) : (
          '체중을 입력해주세요'
        )}
      </p>
    </section>
  );
}
