'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  X,
  PawPrint,
  Scale,
  Utensils,
  Footprints,
  NotebookPen,
  Smile,
  Meh,
  Frown,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { useHomeData } from '@/features/home/hooks/useHomeData';
import { useCreateHealthRecord } from '@/features/health-record/hooks/useCreateHealthRecord';
import styles from './page.module.css';

type RecordType = 'weight' | 'appetite' | 'activity' | 'mood';
type AppetiteLevel = 'good' | 'normal' | 'bad';

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

function NewRecordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { data } = useHomeData();
  const { createHealthRecord, loading: submitting, error } = useCreateHealthRecord();

  const defaultPetId = params.get('petId') ?? data?.pets[0]?.id ?? '';
  const defaultType = (params.get('type') as RecordType | null) ?? 'weight';

  const [petId, setPetId] = useState(defaultPetId);
  const [recordType, setRecordType] = useState<RecordType>(defaultType);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [appetite, setAppetite] = useState<AppetiteLevel>('good');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [memo, setMemo] = useState('');
  const [success, setSuccess] = useState(false);

  const pets = data?.pets ?? [];

  function isValid(): boolean {
    if (!petId) return false;
    if (recordType === 'weight') return weight.trim() !== '';
    if (recordType === 'activity') return duration.trim() !== '';
    if (recordType === 'mood') return memo.trim() !== '';
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid()) return;
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
      setTimeout(() => router.back(), 800);
    }
  }

  if (success) {
    return (
      <div className={styles.successOverlay} role="status">
        <span className={styles.successIcon} aria-hidden="true">
          <Check size={36} strokeWidth={3} />
        </span>
        <p className={styles.successText}>기록했어요!</p>
      </div>
    );
  }

  return (
    <div className={styles.inner}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => router.back()}
          aria-label="닫기"
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>기록 추가</h1>
        <div className={styles.headerRight} aria-hidden="true" />
      </header>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {/* ── 반려동물 선택 ── */}
        {pets.length > 1 && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>반려동물</h2>
            <div className={styles.petButtons} role="group" aria-label="반려동물 선택">
              {pets.map((pet) => (
                <button
                  key={pet.id}
                  type="button"
                  className={`${styles.petBtn} ${petId === pet.id ? styles.petBtnActive : ''}`}
                  onClick={() => setPetId(pet.id)}
                  aria-pressed={petId === pet.id}
                >
                  <PawPrint
                    size={14}
                    strokeWidth={1.75}
                    className={styles.petBtnIcon}
                    aria-hidden="true"
                  />
                  {pet.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── 기록 유형 ── */}
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
                <t.Icon
                  size={22}
                  strokeWidth={1.5}
                  className={styles.typeBtnIcon}
                  aria-hidden="true"
                />
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── 날짜 ── */}
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

        {/* ── 유형별 입력 ── */}
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

        {error && (
          <p className={styles.errorMsg} role="alert">
            {error}
          </p>
        )}

        <div className={styles.footer}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!isValid() || submitting}
            aria-disabled={!isValid() || submitting}
          >
            {submitting ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewRecordPage() {
  return (
    <main className={styles.main} aria-label="기록 추가">
      <Suspense fallback={<div className={styles.suspenseFallback} aria-label="로딩 중" />}>
        <NewRecordContent />
      </Suspense>
    </main>
  );
}
