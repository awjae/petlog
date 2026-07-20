'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Download, ImageIcon, Loader2, X } from 'lucide-react';
import { useReportShare } from '../hooks/useReportShare';
import { ConcernsToggleRow } from './ConcernsToggleRow';
import { ActiveShareStatusRow } from './ActiveShareStatusRow';
import { SharePreviewFrame } from './SharePreviewFrame';
import { StopShareConfirmDialog } from './StopShareConfirmDialog';
import { generateShareImageBlob } from '../utils/shareImage';
import { formatPeriodRange } from '../utils/reportFormat';
import styles from './ShareReportSheet.module.css';

export interface ShareReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  petName: string;
  periodStart: string;
  periodEnd: string;
  overview: string | null;
  highlights: string[] | null;
  concerns: string[] | null;
  recommendations: string[] | null;
}

type ActionKind = 'copy' | 'image' | null;

function buildShareUrl(token: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/share/reports/${token}`;
}

export function ShareReportSheet({
  isOpen,
  onClose,
  reportId,
  petName,
  periodStart,
  periodEnd,
  overview,
  highlights,
  concerns,
  recommendations,
}: ShareReportSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const dragStartTime = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const rAF1 = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(rAF1);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 310);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 310);
  }

  function handleDragStart(e: React.TouchEvent) {
    isDragging.current = true;
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = 0;
    dragStartTime.current = Date.now();
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  }

  function handleDragMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta < 0) return;
    dragCurrentY.current = delta;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`;
  }

  function handleDragEnd() {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = dragCurrentY.current;
    const elapsed = Date.now() - dragStartTime.current;
    const velocity = elapsed > 0 ? delta / elapsed : 0;

    if (sheetRef.current) {
      sheetRef.current.style.transition = '';
      sheetRef.current.style.transform = '';
    }
    if (delta >= 80 || velocity >= 0.5) handleClose();
  }

  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
    refetch: refetchSettings,
    ensureActiveShare,
    stopShare,
    toggleIncludeConcerns,
    stopping,
    toggleError,
    actionError,
    clearActionError,
  } = useReportShare(reportId, { skip: !isOpen });

  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [actionKind, setActionKind] = useState<ActionKind>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [localActionError, setLocalActionError] = useState('');
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSupportsNativeShare(
        typeof navigator !== 'undefined' && typeof navigator.share === 'function',
      );
      setToastMessage('');
      setLocalActionError('');
      setActionKind(null);
      setShowStopConfirm(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(''), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const hasConcerns = Array.isArray(concerns) && concerns.length > 0;
  const isLoadingSettings = settingsLoading || !settings;

  async function handleCopyLink() {
    if (actionKind || isLoadingSettings) return;
    setActionKind('copy');
    setLocalActionError('');
    clearActionError();

    const token = await ensureActiveShare();
    if (!token) {
      setActionKind(null);
      return;
    }

    try {
      await navigator.clipboard.writeText(buildShareUrl(token));
      setToastMessage('링크가 복사됐어요');
    } catch {
      setLocalActionError('복사하지 못했어요. 다시 시도해주세요.');
    } finally {
      setActionKind(null);
    }
  }

  async function handleImageShare() {
    if (actionKind || isLoadingSettings) return;
    setActionKind('image');
    setLocalActionError('');
    clearActionError();

    const token = await ensureActiveShare();
    if (!token) {
      setActionKind(null);
      return;
    }

    try {
      const blob = await generateShareImageBlob({
        petName,
        periodLabel: formatPeriodRange(periodStart, periodEnd),
        overview,
        highlights: highlights ?? [],
        recommendations: recommendations ?? [],
        concerns: settings?.includeConcerns ? (concerns ?? []) : undefined,
      });
      if (!blob) throw new Error('이미지를 생성하지 못했습니다.');

      if (supportsNativeShare) {
        const file = new File([blob], 'petlog-report.png', { type: 'image/png' });
        await navigator.share({
          title: 'Petlog 건강 리포트',
          text: `${petName}의 건강 리포트를 확인해보세요`,
          files: [file],
        });
        setToastMessage('공유했어요');
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = 'petlog-report.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
        setToastMessage('이미지를 저장했어요');
      }
    } catch (err) {
      // 사용자가 네이티브 공유 시트를 취소한 경우는 에러로 취급하지 않는다.
      if (err instanceof DOMException && err.name === 'AbortError') {
        setActionKind(null);
        return;
      }
      setLocalActionError('이미지를 만들지 못했어요. 다시 시도해주세요.');
    } finally {
      setActionKind(null);
    }
  }

  async function handleConfirmStop() {
    const ok = await stopShare();
    if (ok) setShowStopConfirm(false);
  }

  if (!mounted) return null;

  const combinedActionError = localActionError || actionError;

  return (
    <div className={`${styles.root} ${visible ? styles.rootVisible : ''}`}>
      <div className={styles.overlay} onClick={handleClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="리포트 공유하기"
        className={`${styles.sheet} ${visible ? styles.sheetVisible : ''}`}
      >
        <div
          className={styles.dragHandleArea}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className={styles.dragHandle} aria-hidden="true" />
        </div>

        <header
          className={styles.header}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <span className={styles.headerSpacer} aria-hidden="true" />
          <span className={styles.headerTitle}>공유하기</span>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="닫기">
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          {settingsError ? (
            <SharePreviewFrame state="error" onRetry={refetchSettings} />
          ) : (
            <>
              <SharePreviewFrame
                state={isLoadingSettings ? 'loading' : 'ready'}
                data={
                  !isLoadingSettings
                    ? {
                        petName,
                        periodStart,
                        periodEnd,
                        overview,
                        highlights: highlights ?? [],
                        recommendations: recommendations ?? [],
                        concerns:
                          settings.includeConcerns && hasConcerns ? (concerns ?? []) : undefined,
                      }
                    : undefined
                }
              />

              <div className={styles.controls}>
                <ConcernsToggleRow
                  checked={settings?.includeConcerns ?? false}
                  disabled={isLoadingSettings || !hasConcerns}
                  captionOverride={
                    !isLoadingSettings && !hasConcerns
                      ? '이번 리포트에는 우려 사항이 없어요'
                      : undefined
                  }
                  onChange={toggleIncludeConcerns}
                />
                {toggleError && (
                  <p className={styles.inlineError} role="alert">
                    {toggleError}
                  </p>
                )}

                {settings?.isActive && (
                  <ActiveShareStatusRow
                    onStopClick={() => setShowStopConfirm(true)}
                    disabled={stopping}
                  />
                )}
              </div>
            </>
          )}
        </div>

        {!settingsError && (
          <footer className={styles.footer}>
            {combinedActionError && (
              <p className={styles.actionErrorBar} role="alert">
                {combinedActionError}
              </p>
            )}

            {toastMessage && (
              <div className={styles.inlineToast} role="status" aria-live="polite">
                {toastMessage}
              </div>
            )}

            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={handleCopyLink}
                disabled={isLoadingSettings || actionKind !== null}
                aria-busy={actionKind === 'copy'}
              >
                {actionKind === 'copy' ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} aria-hidden="true" />
                    복사 중...
                  </>
                ) : (
                  <>
                    <Copy size={18} strokeWidth={2} aria-hidden="true" />
                    링크 복사
                  </>
                )}
              </button>

              <button
                type="button"
                className={styles.imageBtn}
                onClick={handleImageShare}
                disabled={isLoadingSettings || actionKind !== null}
                aria-busy={actionKind === 'image'}
              >
                {actionKind === 'image' ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} aria-hidden="true" />
                    생성 중...
                  </>
                ) : supportsNativeShare ? (
                  <>
                    <ImageIcon size={18} strokeWidth={2} aria-hidden="true" />
                    이미지로 공유
                  </>
                ) : (
                  <>
                    <Download size={18} strokeWidth={2} aria-hidden="true" />
                    이미지 저장
                  </>
                )}
              </button>
            </div>
          </footer>
        )}
      </div>

      {showStopConfirm && (
        <StopShareConfirmDialog
          loading={stopping}
          onConfirm={handleConfirmStop}
          onClose={() => setShowStopConfirm(false)}
        />
      )}
    </div>
  );
}
