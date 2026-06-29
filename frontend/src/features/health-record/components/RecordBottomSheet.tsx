'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { RecordForm, type RecordType } from './RecordForm';
import styles from './RecordBottomSheet.module.css';

export interface RecordBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  petId: string;
  defaultType?: RecordType;
}

export function RecordBottomSheet({
  isOpen,
  onClose,
  petId,
  defaultType = 'weight',
}: RecordBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  // 시트가 열릴 때마다 폼을 초기화하기 위한 키
  const [sessionId, setSessionId] = useState(0);

  const sheetRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const dragStartTime = useRef(0);

  // 마운트/언마운트 + 열림/닫힘 애니메이션
  useEffect(() => {
    if (isOpen) {
      setSessionId((id) => id + 1);
      setMounted(true);
      // 두 번의 rAF로 CSS 트랜지션이 올바르게 동작하도록 보장
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

  // 키보드 팝업 시 시트 위치 조정 (visualViewport API)
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const handleViewportChange = () => {
      if (sheetRef.current) {
        const offset = window.innerHeight - vv.height + vv.offsetTop;
        sheetRef.current.style.bottom = `${Math.max(0, offset)}px`;
      }
    };

    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);

    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
      // 시트 닫힐 때 bottom 리셋
      if (sheetRef.current) {
        sheetRef.current.style.bottom = '';
      }
    };
  }, [isOpen]);

  // 닫힘 애니메이션 후 부모의 onClose 호출
  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 310);
  }

  // ── 드래그 제스처 (드래그 핸들 + 헤더 영역만) ──

  function handleDragStart(e: React.TouchEvent) {
    isDragging.current = true;
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = 0;
    dragStartTime.current = Date.now();
    // 드래그 중 CSS 트랜지션 비활성화
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
  }

  function handleDragMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    // 위로 드래그는 무시 (아래로만 닫힘)
    if (delta < 0) return;
    dragCurrentY.current = delta;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  }

  function handleDragEnd() {
    if (!isDragging.current) return;
    isDragging.current = false;

    const delta = dragCurrentY.current;
    const elapsed = Date.now() - dragStartTime.current;
    // 속도 계산: px/ms
    const velocity = elapsed > 0 ? delta / elapsed : 0;

    // CSS 트랜지션 복원
    if (sheetRef.current) {
      sheetRef.current.style.transition = '';
      sheetRef.current.style.transform = '';
    }

    // 임계값: 80px 이상 또는 속도 0.5px/ms 이상
    if (delta >= 80 || velocity >= 0.5) {
      handleClose();
    }
    // 임계값 미달: CSS 트랜지션으로 자동 복원됨
  }

  if (!mounted) return null;

  return (
    <div className={`${styles.root} ${visible ? styles.rootVisible : ''}`}>
      {/* 오버레이: 탭 시 닫힘 */}
      <div className={styles.overlay} onClick={handleClose} aria-hidden="true" />

      {/* 시트 */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="기록 남기기"
        className={`${styles.sheet} ${visible ? styles.sheetVisible : ''}`}
      >
        {/* 드래그 핸들 영역 */}
        <div
          className={styles.dragHandleArea}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className={styles.dragHandle} aria-hidden="true" />
        </div>

        {/* 헤더: 드래그 영역 겸용 */}
        <header
          className={styles.sheetHeader}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <span className={styles.sheetTitle}>기록 남기기</span>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="닫기">
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>

        {/* 폼: 시트가 열릴 때마다 key로 초기화 */}
        <RecordForm
          key={sessionId}
          petId={petId}
          defaultType={defaultType}
          onSuccess={handleClose}
        />
      </div>
    </div>
  );
}
