'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Scale,
  Utensils,
  Footprints,
  NotebookPen,
  Smile,
  Meh,
  Frown,
  Check,
  Loader2,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useCreateHealthRecord } from '../hooks/useCreateHealthRecord';
import styles from './RecordForm.module.css';

export type RecordType = 'weight' | 'appetite' | 'activity' | 'mood';
type AppetiteLevel = 'good' | 'normal' | 'bad';

export interface RecordFormProps {
  petId: string;
  defaultType?: RecordType;
  onSuccess: () => void;
}

const RECORD_TYPES: { type: RecordType; Icon: LucideIcon; label: string }[] = [
  { type: 'weight', Icon: Scale, label: '체중' },
  { type: 'appetite', Icon: Utensils, label: '식사' },
  { type: 'activity', Icon: Footprints, label: '산책' },
  { type: 'mood', Icon: NotebookPen, label: '메모' },
];

const APPETITE_OPTIONS: { value: AppetiteLevel; Icon: LucideIcon; label: string }[] = [
  { value: 'good', Icon: Smile, label: '잘 먹음' },
  { value: 'normal', Icon: Meh, label: '보통' },
  { value: 'bad', Icon: Frown, label: '안 먹음' },
];

export function RecordForm({ petId, defaultType = 'weight', onSuccess }: RecordFormProps) {
  const { createHealthRecord, loading: submitting, error } = useCreateHealthRecord();

  const [recordType, setRecordType] = useState<RecordType>(defaultType);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [appetite, setAppetite] = useState<AppetiteLevel>('good');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [memo, setMemo] = useState('');
  const [success, setSuccess] = useState(false);

  function isValid(): boolean {
    if (!petId) return false;
    if (recordType === 'weight') return weight.trim() !== '';
    if (recordType === 'activity') return duration.trim() !== '';
    if (recordType === 'mood') return memo.trim() !== '';
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid() || submitting || success) return;

    const ok = await createHealthRecord({
      petId,
      type: recordType,
      date,
      weight,
      appetite,
      duration,
      distance,
      memo,
    });

    if (ok) {
      setSuccess(true);
      setTimeout(onSuccess, 800);
    }
  }

  const isSaveBtnDisabled = (!isValid() && !success) || submitting;

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {/* ── 스크롤 영역 ── */}
      <div className={styles.formContent}>
        {/* 기록 유형 */}
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>기록 유형</h2>
          <div className={styles.typeGrid} role="group" aria-label="기록 유형 선택">
            {RECORD_TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                className={`${styles.typeBtn} ${recordType === t.type ? styles.typeBtnActive : ''}`}
                onClick={() => setRecordType(t.type)}
                aria-pressed={recordType === t.type}
              >
                <t.Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </div>
          <Link
            href={`/records/new?petId=${petId}&type=symptom`}
            className={styles.healthAlertLink}
            aria-label="증상·배변·구토 등 건강 이상 기록 상세 입력하기"
          >
            증상·배변·구토 기록하기
            <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </section>

        {/* 날짜 */}
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>날짜</h2>
          <input
            type="date"
            className={styles.dateInput}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            aria-label="기록 날짜"
          />
        </section>

        {/* 체중 */}
        {recordType === 'weight' && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>체중</h2>
            <div className={styles.inputRow}>
              <input
                type="number"
                className={styles.numberInput}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.0"
                step="0.1"
                min="0"
                max="200"
                aria-label="체중 (kg)"
                required
              />
              <span className={styles.unit}>kg</span>
            </div>
          </section>
        )}

        {/* 식욕 */}
        {recordType === 'appetite' && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>식욕</h2>
            <div className={styles.segmented} role="group" aria-label="식욕 상태">
              {APPETITE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.segBtn} ${appetite === opt.value ? styles.segBtnActive : ''}`}
                  onClick={() => setAppetite(opt.value)}
                  aria-pressed={appetite === opt.value}
                >
                  <opt.Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                  {opt.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 산책 */}
        {recordType === 'activity' && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>산책</h2>
            <div className={styles.activityRow}>
              <div className={styles.inputRow}>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="0"
                  min="0"
                  aria-label="산책 시간 (분)"
                  required
                />
                <span className={styles.unit}>분</span>
              </div>
              <div className={styles.inputRow}>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                  aria-label="산책 거리 (km, 선택)"
                />
                <span className={styles.unit}>km</span>
              </div>
            </div>
            <p className={styles.optionalHint}>거리는 선택 사항이에요</p>
          </section>
        )}

        {/* 메모 */}
        {recordType === 'mood' && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>메모</h2>
            <textarea
              className={styles.textarea}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="오늘 어땠나요? 특이사항을 자유롭게 적어보세요"
              rows={4}
              maxLength={500}
              aria-label="메모"
              required
            />
            <p className={styles.charCount}>{memo.length} / 500</p>
          </section>
        )}

        {/* 추가 메모 (선택) */}
        {recordType !== 'mood' && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>
              추가 메모 <span className={styles.optional}>(선택)</span>
            </h2>
            <textarea
              className={styles.textarea}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="특이사항이 있으면 적어주세요"
              rows={3}
              maxLength={500}
              aria-label="추가 메모 (선택)"
            />
          </section>
        )}
      </div>

      {/* ── 푸터 (sticky) ── */}
      <div className={styles.sheetFooter}>
        {error && !success && (
          <div className={styles.errorBanner} role="alert">
            저장에 실패했어요. 다시 시도해주세요.
          </div>
        )}

        <button
          type="submit"
          className={`${styles.saveBtn} ${success ? styles.saveBtnSuccess : ''}`}
          disabled={isSaveBtnDisabled}
          aria-disabled={isSaveBtnDisabled}
        >
          {success ? (
            <>
              <Check size={18} strokeWidth={2.5} aria-hidden="true" />
              기록했어요!
            </>
          ) : submitting ? (
            <>
              <Loader2 size={18} strokeWidth={2} className={styles.spinner} aria-hidden="true" />
              저장 중...
            </>
          ) : (
            '저장하기'
          )}
        </button>
      </div>
    </form>
  );
}
