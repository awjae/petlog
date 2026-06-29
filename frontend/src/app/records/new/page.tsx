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
  Thermometer,
  Droplets,
  Waves,
  Smile,
  Meh,
  Frown,
  Circle,
  CircleAlert,
  CircleX,
  AlertTriangle,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { useHomeData } from '@/features/home/hooks/useHomeData';
import { useCreateHealthRecord } from '@/features/health-record/hooks/useCreateHealthRecord';
import styles from './page.module.css';

type RecordType = 'weight' | 'appetite' | 'activity' | 'mood' | 'symptom' | 'stool' | 'vomit';
type AppetiteLevel = 'good' | 'normal' | 'bad';

const DAILY_TYPES: { type: RecordType; Icon: LucideIcon; label: string }[] = [
  { type: 'weight', Icon: Scale, label: '체중' },
  { type: 'appetite', Icon: Utensils, label: '식사' },
  { type: 'activity', Icon: Footprints, label: '산책' },
  { type: 'mood', Icon: NotebookPen, label: '메모' },
];

const HEALTH_TYPES: { type: RecordType; Icon: LucideIcon; label: string }[] = [
  { type: 'symptom', Icon: Thermometer, label: '증상' },
  { type: 'stool', Icon: Droplets, label: '배변' },
  { type: 'vomit', Icon: Waves, label: '구토' },
];

const APPETITE_OPTIONS: { value: AppetiteLevel; Icon: LucideIcon; label: string }[] = [
  { value: 'good', Icon: Smile, label: '잘 먹음' },
  { value: 'normal', Icon: Meh, label: '보통' },
  { value: 'bad', Icon: Frown, label: '안 먹음' },
];

const SYMPTOM_OPTIONS = [
  '기침/재채기',
  '구토',
  '설사',
  '콧물/눈곱',
  '다리를 저는 행동',
  '무기력/처짐',
  '과도한 긁음',
  '배가 부어 보임',
  '기타',
];

const SEVERITY_OPTIONS: { value: 1 | 2 | 3; label: string; Icon: LucideIcon; color: string }[] = [
  { value: 1, label: '경미함', Icon: Circle, color: '#34C759' },
  { value: 2, label: '보통', Icon: CircleAlert, color: '#FF9F0A' },
  { value: 3, label: '심각함', Icon: CircleX, color: '#FF3B30' },
];

const STOOL_TYPES = ['정상', '무름', '설사', '혈변', '변비'];

const VOMIT_CONTENTS = [
  '사료 / 음식',
  '풀 / 이물질',
  '노란 액체',
  '흰 거품',
  '피가 섞임',
  '모르겠음',
];

const COUNT_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: '1회' },
  { value: 2, label: '2-3회' },
  { value: 3, label: '4회 이상' },
];

const VALID_TYPES: RecordType[] = [
  'weight',
  'appetite',
  'activity',
  'mood',
  'symptom',
  'stool',
  'vomit',
];

function NewRecordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { data } = useHomeData();
  const { createHealthRecord, loading: submitting, error } = useCreateHealthRecord();

  const defaultPetId = params.get('petId') ?? data?.pets[0]?.id ?? '';
  const rawType = params.get('type') as RecordType | null;
  const defaultType: RecordType = rawType && VALID_TYPES.includes(rawType) ? rawType : 'weight';

  const [petId, setPetId] = useState(defaultPetId);
  const [recordType, setRecordType] = useState<RecordType>(defaultType);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // weight
  const [weight, setWeight] = useState('');
  // appetite
  const [appetite, setAppetite] = useState<AppetiteLevel>('good');
  // activity
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  // mood / 공통 메모
  const [memo, setMemo] = useState('');
  // symptom
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<1 | 2 | 3 | null>(null);
  // stool
  const [stoolType, setStoolType] = useState<string | null>(null);
  const [stoolCount, setStoolCount] = useState<1 | 2 | 3 | null>(null);
  // vomit
  const [vomitContent, setVomitContent] = useState<string | null>(null);
  const [vomitCount, setVomitCount] = useState<1 | 2 | 3 | null>(null);
  // 토스트
  const [showToast, setShowToast] = useState(false);
  const [success, setSuccess] = useState(false);

  const pets = data?.pets ?? [];

  function handleTypeChange(type: RecordType) {
    setRecordType(type);
    setMemo('');
    setSymptoms([]);
    setSeverity(null);
    setStoolType(null);
    setStoolCount(null);
    setVomitContent(null);
    setVomitCount(null);
  }

  function handleSymptomToggle(symptom: string) {
    setSymptoms((prev) => {
      if (prev.includes(symptom)) return prev.filter((s) => s !== symptom);
      if (prev.length >= 5) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        return prev;
      }
      return [...prev, symptom];
    });
  }

  function isValid(): boolean {
    if (!petId) return false;
    switch (recordType) {
      case 'weight':
        return weight.trim() !== '';
      case 'activity':
        return duration.trim() !== '';
      case 'mood':
        return memo.trim() !== '';
      case 'symptom':
        return symptoms.length > 0 && severity !== null;
      case 'stool':
        return stoolType !== null;
      case 'vomit':
        return vomitCount !== null;
      default:
        return true;
    }
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
      symptoms,
      severity: severity ?? undefined,
      stoolType: stoolType ?? undefined,
      stoolCount: stoolCount ?? undefined,
      vomitContent: vomitContent ?? undefined,
      vomitCount: vomitCount ?? undefined,
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

  const showWarning =
    (recordType === 'symptom' && (symptoms.includes('구토') || symptoms.includes('설사'))) ||
    (recordType === 'stool' && stoolType === '혈변') ||
    (recordType === 'vomit' && vomitContent === '피가 섞임');

  const warningText =
    recordType === 'stool'
      ? '혈변이 보일 경우 수의사 상담을 권장해요.'
      : recordType === 'vomit'
        ? '피가 섞인 구토가 보일 경우 수의사 상담을 권장해요.'
        : '해당 증상이 심각하다면 수의사 상담을 권장해요.';

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
        {/* 반려동물 선택 */}
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

        {/* 기록 유형 */}
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>기록 유형</h2>
          <div className={styles.typeGrid} role="group" aria-label="일상 기록 유형 선택">
            {DAILY_TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                className={`${styles.typeBtn} ${recordType === t.type ? styles.typeBtnActive : ''}`}
                onClick={() => handleTypeChange(t.type)}
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

          <p className={styles.typeGroupDivider}>건강 이상 기록</p>

          <div className={styles.typeGridHealth} role="group" aria-label="건강 이상 기록 유형 선택">
            {HEALTH_TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                className={`${styles.typeBtn} ${recordType === t.type ? styles.typeBtnActive : ''}`}
                onClick={() => handleTypeChange(t.type)}
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

        {/* ── 체중 ── */}
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

        {/* ── 식사 ── */}
        {recordType === 'appetite' && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>식사</h2>
            <div className={styles.segmented} role="group" aria-label="식사 상태">
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

        {/* ── 산책 ── */}
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

        {/* ── 메모 ── */}
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

        {/* ── 증상 ── */}
        {recordType === 'symptom' && (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>
                증상 선택 <span className={styles.optional}>(최대 5개)</span>
              </h2>
              <div className={styles.symptomChipGroup} role="group" aria-label="증상 선택">
                {SYMPTOM_OPTIONS.map((s) => {
                  const isSelected = symptoms.includes(s);
                  const isDisabled = !isSelected && symptoms.length >= 5;
                  return (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.symptomChip} ${isSelected ? styles.symptomChipSelected : ''} ${isDisabled ? styles.symptomChipDisabled : ''}`}
                      onClick={() => handleSymptomToggle(s)}
                      disabled={isDisabled}
                      aria-pressed={isSelected}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {symptoms.includes('기타') && (
                <div className={styles.otherMemoArea}>
                  <textarea
                    className={styles.textarea}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="어떤 증상인지 적어주세요"
                    rows={3}
                    maxLength={200}
                    aria-label="기타 증상 내용"
                  />
                </div>
              )}
            </section>

            {showWarning && (
              <div className={styles.warningBanner} role="note">
                <AlertTriangle size={14} strokeWidth={2} aria-hidden="true" />
                <span>{warningText}</span>
              </div>
            )}

            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>심각도</h2>
              <div className={styles.segmented} role="group" aria-label="심각도 선택">
                {SEVERITY_OPTIONS.map(({ value, label, Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.segBtn} ${severity === value ? styles.segBtnActive : ''}`}
                    style={
                      severity === value
                        ? ({ '--seg-active-bg': color } as React.CSSProperties)
                        : undefined
                    }
                    onClick={() => setSeverity(severity === value ? null : value)}
                    aria-pressed={severity === value}
                  >
                    <Icon size={14} strokeWidth={2} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {!symptoms.includes('기타') && (
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
                />
              </section>
            )}
          </>
        )}

        {/* ── 배변 ── */}
        {recordType === 'stool' && (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>배변 형태</h2>
              <div className={styles.symptomChipGroup} role="group" aria-label="배변 형태 선택">
                {STOOL_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`${styles.symptomChip} ${stoolType === t ? styles.symptomChipSelected : ''}`}
                    onClick={() => setStoolType(stoolType === t ? null : t)}
                    aria-pressed={stoolType === t}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {showWarning && (
                <div className={styles.warningBanner} role="note">
                  <AlertTriangle size={14} strokeWidth={2} aria-hidden="true" />
                  <span>{warningText}</span>
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>
                횟수 <span className={styles.optional}>(선택)</span>
              </h2>
              <div className={styles.segmented} role="group" aria-label="배변 횟수 선택">
                {COUNT_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.segBtn} ${stoolCount === value ? styles.segBtnActive : ''}`}
                    onClick={() => setStoolCount(stoolCount === value ? null : value)}
                    aria-pressed={stoolCount === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

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
              />
            </section>
          </>
        )}

        {/* ── 구토 ── */}
        {recordType === 'vomit' && (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>
                내용물 <span className={styles.optional}>(선택)</span>
              </h2>
              <div className={styles.symptomChipGroup} role="group" aria-label="구토 내용물 선택">
                {VOMIT_CONTENTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`${styles.symptomChip} ${vomitContent === c ? styles.symptomChipSelected : ''}`}
                    onClick={() => setVomitContent(vomitContent === c ? null : c)}
                    aria-pressed={vomitContent === c}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {showWarning && (
                <div className={styles.warningBanner} role="note">
                  <AlertTriangle size={14} strokeWidth={2} aria-hidden="true" />
                  <span>{warningText}</span>
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>횟수</h2>
              <div className={styles.segmented} role="group" aria-label="구토 횟수 선택">
                {COUNT_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.segBtn} ${vomitCount === value ? styles.segBtnActive : ''}`}
                    onClick={() => setVomitCount(vomitCount === value ? null : value)}
                    aria-pressed={vomitCount === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

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
              />
            </section>
          </>
        )}

        {/* 비일상 기록 추가 메모 */}
        {(recordType === 'weight' || recordType === 'appetite' || recordType === 'activity') && (
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

      {showToast && (
        <div className={styles.toastMessage} role="status" aria-live="polite">
          최대 5개까지 선택할 수 있어요
        </div>
      )}
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
