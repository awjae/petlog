'use client';

import { useEffect, useRef, useState } from 'react';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { Check, ChevronLeft, LoaderCircle, X } from 'lucide-react';
import { useGenerateReport } from '../hooks/useGenerateReport';
import { useReportPeriodPreview } from '../hooks/useReportPeriodPreview';
import { PeriodCalendar } from './PeriodCalendar';
import { PeriodValidityCard, type PeriodValidityState } from './PeriodValidityCard';
import {
  PERIOD_PRESETS,
  type PeriodPresetKey,
  clampDate,
  formatDateLabel,
  formatPeriodSummary,
  getPresetRange,
  isPresetAvailable,
  minDateStr,
  toDateOnlyFromIso,
  toEndOfDayIso,
  toStartOfDayIso,
  todayDateOnly,
} from '../utils/reportPeriod';
import styles from './ReportPeriodSheet.module.css';

type SheetView = 'summary' | 'calendar-start' | 'calendar-end';

export interface ReportPeriodSheetProps {
  isOpen: boolean;
  onClose: () => void;
  petId: string;
  petCreatedAt: string;
  onGenerated: (reportId: string) => void;
  onGenerateError: (message: string) => void;
}

export function ReportPeriodSheet({
  isOpen,
  onClose,
  petId,
  petCreatedAt,
  onGenerated,
  onGenerateError,
}: ReportPeriodSheetProps) {
  const [view, setView] = useState<SheetView>('summary');

  const today = todayDateOnly();
  const minDate = petCreatedAt ? minDateStr(toDateOnlyFromIso(petCreatedAt), today) : today;

  const [periodStart, setPeriodStart] = useState(minDate);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [selectedPreset, setSelectedPreset] = useState<PeriodPresetKey | null>(null);
  const [debounceNext, setDebounceNext] = useState(false);

  // 진입 시 "최근 30일" 프리셋을 기본 선택한다(전환 상태는 BottomSheet이 관리).
  useEffect(() => {
    if (!isOpen) return;

    const openToday = todayDateOnly();
    const openMinDate = petCreatedAt
      ? minDateStr(toDateOnlyFromIso(petCreatedAt), openToday)
      : openToday;
    const last30 = getPresetRange('last30', openToday);
    const start = clampDate(last30.start, openMinDate, openToday);

    setPeriodStart(start);
    setPeriodEnd(last30.end);
    setSelectedPreset(start === last30.start ? 'last30' : null);
    setView('summary');
    setDebounceNext(false);
  }, [isOpen, petCreatedAt]);

  function handlePresetClick(key: PeriodPresetKey) {
    if (!isPresetAvailable(key, minDate, today)) return;
    const range = getPresetRange(key, today);
    setSelectedPreset(key);
    setPeriodStart(range.start);
    setPeriodEnd(range.end);
    setDebounceNext(false);
  }

  function handleSelectStart(date: string) {
    setPeriodStart(date);
    setSelectedPreset(null);
    setDebounceNext(true);
    // 시작일 확정 후 종료일 캘린더로 자동 연속 전환
    setView('calendar-end');
  }

  function handleSelectEnd(date: string) {
    setPeriodEnd(date);
    setSelectedPreset(null);
    setDebounceNext(true);
    setView('summary');
  }

  const { generateReport, loading: generating, error: generateError } = useGenerateReport();
  const onGenerateErrorRef = useRef(onGenerateError);
  onGenerateErrorRef.current = onGenerateError;

  useEffect(() => {
    if (generateError) onGenerateErrorRef.current(generateError);
  }, [generateError]);

  const {
    preview,
    loading: previewLoading,
    error: previewError,
    refetch: refetchPreview,
  } = useReportPeriodPreview(petId, periodStart, periodEnd, {
    skip: !isOpen,
    debounce: debounceNext,
  });

  const validityState: PeriodValidityState = previewError
    ? 'error'
    : previewLoading || !preview
      ? 'loading'
      : preview.recordCount === 0
        ? 'empty'
        : !preview.hasEnoughRecords
          ? 'insufficient'
          : 'valid';

  const anyPresetDisabled = PERIOD_PRESETS.some((p) => !isPresetAvailable(p.key, minDate, today));

  const isCalendarView = view !== 'summary';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} label="리포트 기간 선택" maxHeight="85dvh">
      {({ close, drag }) => {
        async function handleSubmit() {
          if (validityState !== 'valid' || generating) return;
          const reportId = await generateReport(
            petId,
            toStartOfDayIso(periodStart),
            toEndOfDayIso(periodEnd),
          );
          if (reportId) {
            onGenerated(reportId);
            close();
          }
        }

        return (
          <>
            <header className={styles.header} {...drag}>
              {isCalendarView ? (
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => setView('summary')}
                  aria-label="뒤로"
                >
                  <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
                </button>
              ) : (
                <span className={styles.headerSpacer} aria-hidden="true" />
              )}
              <span className={styles.headerTitle}>
                {view === 'calendar-start'
                  ? '시작일 선택'
                  : view === 'calendar-end'
                    ? '종료일 선택'
                    : '리포트 기간 선택'}
              </span>
              <button type="button" className={styles.closeBtn} onClick={close} aria-label="닫기">
                <X size={20} strokeWidth={2} aria-hidden="true" />
              </button>
            </header>

            <div className={styles.body}>
              <div key={view} className={styles.panel}>
                {view === 'summary' ? (
                  <>
                    <div className={styles.presetGrid}>
                      {PERIOD_PRESETS.map((preset) => {
                        const available = isPresetAvailable(preset.key, minDate, today);
                        const isSelected = selectedPreset === preset.key;
                        return (
                          <button
                            key={preset.key}
                            type="button"
                            className={`${styles.presetChip} ${isSelected ? styles.presetChipSelected : ''} ${
                              !available ? styles.presetChipDisabled : ''
                            }`}
                            disabled={!available}
                            onClick={() => handlePresetClick(preset.key)}
                          >
                            {isSelected && (
                              <Check
                                size={14}
                                strokeWidth={2.5}
                                className={styles.presetCheck}
                                aria-hidden="true"
                              />
                            )}
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    {anyPresetDisabled && (
                      <p className={styles.presetCaption}>
                        등록일 기준으로 아직 선택할 수 없는 기간은 비활성화돼 있어요
                      </p>
                    )}

                    <p className={styles.customLabel}>직접 선택</p>
                    <div className={styles.customFields}>
                      <button
                        type="button"
                        className={styles.fieldBtn}
                        onClick={() => setView('calendar-start')}
                      >
                        <span className={styles.fieldLabel}>시작일</span>
                        <span className={styles.fieldValue}>{formatDateLabel(periodStart)}</span>
                      </button>
                      <span className={styles.fieldSep}>~</span>
                      <button
                        type="button"
                        className={styles.fieldBtn}
                        onClick={() => setView('calendar-end')}
                      >
                        <span className={styles.fieldLabel}>종료일</span>
                        <span className={styles.fieldValue}>{formatDateLabel(periodEnd)}</span>
                      </button>
                    </div>

                    <p className={styles.summaryText}>
                      {formatPeriodSummary(periodStart, periodEnd)}
                    </p>

                    <PeriodValidityCard
                      state={validityState}
                      recordCount={preview?.recordCount}
                      recordDays={preview?.recordDays}
                      onRetry={refetchPreview}
                    />

                    <p className={styles.guidance}>최소 7일, 최대 90일까지 선택할 수 있어요</p>
                  </>
                ) : (
                  <PeriodCalendar
                    selectedDate={view === 'calendar-start' ? periodStart : periodEnd}
                    referenceDate={view === 'calendar-end' ? periodStart : null}
                    minDate={minDate}
                    maxDate={today}
                    onSelect={view === 'calendar-start' ? handleSelectStart : handleSelectEnd}
                  />
                )}
              </div>
            </div>

            {!isCalendarView && (
              <footer className={styles.footer}>
                <button
                  type="button"
                  className={`${styles.ctaBtn} ${
                    validityState === 'valid' && !generating
                      ? styles.ctaBtnActive
                      : styles.ctaBtnDisabled
                  }`}
                  disabled={validityState !== 'valid' || generating}
                  onClick={handleSubmit}
                  aria-busy={generating}
                >
                  {generating ? (
                    <>
                      <LoaderCircle size={20} className={styles.spinner} aria-hidden="true" /> 생성
                      중...
                    </>
                  ) : (
                    '이 기간으로 리포트 생성하기'
                  )}
                </button>
              </footer>
            )}
          </>
        );
      }}
    </BottomSheet>
  );
}
