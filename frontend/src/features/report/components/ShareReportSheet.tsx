'use client';

import { useEffect, useState } from 'react';
import { BottomSheet } from '@/shared/components/BottomSheet';
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

  const combinedActionError = localActionError || actionError;

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        label="리포트 공유하기"
        maxHeight="88dvh"
        draggable
      >
        {({ close, drag }) => (
          <>
            <header className={styles.header} {...drag}>
              <span className={styles.headerSpacer} aria-hidden="true" />
              <span className={styles.headerTitle}>공유하기</span>
              <button type="button" className={styles.closeBtn} onClick={close} aria-label="닫기">
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
                              settings.includeConcerns && hasConcerns
                                ? (concerns ?? [])
                                : undefined,
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
          </>
        )}
      </BottomSheet>

      {showStopConfirm && (
        <StopShareConfirmDialog
          loading={stopping}
          onConfirm={handleConfirmStop}
          onClose={() => setShowStopConfirm(false)}
        />
      )}
    </>
  );
}
