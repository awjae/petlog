'use client';

import { useState } from 'react';
import { useLocalToday } from '@/shared/hooks/useLocalToday';
import { vaccineSchedule, type VaccineSpecies } from './vaccineSchedule';
import styles from './calculator.module.css';

export function VaccineScheduleCalculator() {
  const today = useLocalToday();
  const [species, setSpecies] = useState<VaccineSpecies>('dog');
  const [birthDate, setBirthDate] = useState('');

  const doses = birthDate ? vaccineSchedule(species, birthDate) : [];

  return (
    <section className={styles.calculator} aria-label="예방접종 일정 계산기">
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>종류</span>
          <select
            className={styles.input}
            value={species}
            onChange={(e) => setSpecies(e.target.value as VaccineSpecies)}
          >
            <option value="dog">강아지</option>
            <option value="cat">고양이</option>
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>생년월일</span>
          <input
            className={styles.input}
            type="date"
            max={today}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </label>
      </div>

      {doses.length === 0 ? (
        <p className={styles.result}>생년월일을 넣으면 접종 예정일을 보여드려요</p>
      ) : (
        <ol className={styles.doseList} aria-live="polite">
          {doses.map((dose) => (
            <li
              key={dose.order}
              className={`${styles.dose} ${today && dose.date < today ? styles.dosePast : ''}`}
            >
              <span className={styles.doseDate}>
                {dose.order}차 · {dose.date}
              </span>
              <span className={styles.doseVaccines}>{dose.vaccines}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
