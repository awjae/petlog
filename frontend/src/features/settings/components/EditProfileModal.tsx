'use client';

import { useEffect, useRef, useState } from 'react';
import { useOverlayDismiss } from '@/shared/hooks/useOverlayDismiss';
import { useSheetTransition } from '@/shared/hooks/useSheetTransition';
import { X } from 'lucide-react';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import styles from './EditProfileModal.module.css';

interface EditProfileModalProps {
  isOpen: boolean;
  currentName: string | null;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, currentName, onClose }: EditProfileModalProps) {
  const { mounted, visible, close: handleClose } = useSheetTransition(isOpen, onClose);

  useOverlayDismiss(isOpen, handleClose);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const { updateProfile, loading, error } = useUpdateProfile();

  // 최신 currentName을 effect 재실행 없이 읽기 위한 ref
  const currentNameRef = useRef(currentName);
  useEffect(() => {
    currentNameRef.current = currentName;
  }, [currentName]);

  // 열릴 때 이름을 현재 값으로 되돌리고 입력에 포커스를 준다.
  // (전환 상태는 useSheetTransition이 관리한다)
  useEffect(() => {
    if (!isOpen) return;
    setName(currentNameRef.current ?? '');
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [isOpen]);

  // 키보드 팝업 시 시트 위치 조정
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
      if (sheetRef.current) {
        sheetRef.current.style.bottom = '';
      }
    };
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) {
      handleClose();
      return;
    }
    const ok = await updateProfile(trimmed);
    if (ok) handleClose();
  }

  const isChanged = name.trim() !== (currentName ?? '') && name.trim().length > 0;

  if (!mounted) return null;

  return (
    <div className={`${styles.root} ${visible ? styles.rootVisible : ''}`}>
      <div className={styles.overlay} onClick={handleClose} aria-hidden="true" />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="프로필 편집"
        className={`${styles.sheet} ${visible ? styles.sheetVisible : ''}`}
      >
        <div className={styles.dragHandleArea}>
          <div className={styles.dragHandle} aria-hidden="true" />
        </div>

        <header className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>프로필 편집</span>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="닫기">
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>

        <form className={styles.body} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="profile-name" className={styles.label}>
              닉네임
            </label>
            <input
              ref={inputRef}
              id="profile-name"
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="닉네임을 입력하세요"
              maxLength={20}
              autoComplete="off"
            />
            <span className={styles.charCount}>{name.length}/20</span>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading || !isChanged}>
            {loading ? '저장 중...' : '저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
