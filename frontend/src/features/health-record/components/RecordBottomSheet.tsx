'use client';

import { useEffect, useRef, useState } from 'react';
import { BottomSheet } from '@/shared/components/BottomSheet';
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
  // 시트가 열릴 때마다 폼을 초기화하기 위한 키
  const [sessionId, setSessionId] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // 열릴 때마다 폼을 새 세션으로 초기화한다(전환 상태는 BottomSheet이 관리).
  useEffect(() => {
    if (!isOpen) return;
    setSessionId((id) => id + 1);
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

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      label="기록 남기기"
      maxHeight="85dvh"
      draggable
      sheetRef={sheetRef}
    >
      {({ close, drag }) => (
        <>
          {/* 헤더도 드래그로 닫을 수 있다 */}
          <header className={styles.sheetHeader} {...drag}>
            <span className={styles.sheetTitle}>기록 남기기</span>
            <button type="button" className={styles.closeBtn} onClick={close} aria-label="닫기">
              <X size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </header>

          {/* 폼: 시트가 열릴 때마다 key로 초기화 */}
          <RecordForm key={sessionId} petId={petId} defaultType={defaultType} onSuccess={close} />
        </>
      )}
    </BottomSheet>
  );
}
