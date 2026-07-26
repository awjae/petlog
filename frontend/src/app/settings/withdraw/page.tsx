'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApolloClient } from '@apollo/client/react';
import { ChevronLeft } from 'lucide-react';
import { useWithdrawAccount } from '@/features/auth/hooks/useWithdrawAccount';
import { useSelectedPetStore } from '@/features/shared/stores/selectedPet.store';
import { setPendingToast } from '@/features/shared/utils/pendingToast';
import { useToast, ToastContainer } from '@/features/shared/components/Toast';
import styles from './page.module.css';

export default function WithdrawAccountPage() {
  const router = useRouter();
  const client = useApolloClient();
  const [password, setPassword] = useState('');
  const { withdraw, loading, passwordError } = useWithdrawAccount();
  const { toasts, addToast, dismiss } = useToast();

  function isValid() {
    return password.length >= 8;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid() || loading) return;

    const result = await withdraw(password);

    if (result.ok) {
      useSelectedPetStore.getState().reset();
      await client.clearStore();
      setPendingToast('탈퇴 처리되었어요. 30일 이내 로그인하면 복구할 수 있어요.');
      router.push('/login');
      return;
    }

    if (result.reason === 'session-expired') {
      setPendingToast('로그인이 만료되었어요. 다시 로그인해주세요.');
      router.push('/login');
      return;
    }

    if (result.reason === 'unknown') {
      addToast('잠시 후 다시 시도해주세요', 'error');
    }
  }

  return (
    <main className={styles.main} aria-label="탈퇴 확정">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.back()}
          disabled={loading}
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>탈퇴 확정</h1>
        <div className={styles.headerRight} aria-hidden="true" />
      </header>

      <div className={styles.inner}>
        <p className={styles.guide}>본인 확인을 위해 비밀번호를 입력해주세요</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="withdraw-password">
              비밀번호
            </label>
            <input
              id="withdraw-password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상"
              autoComplete="current-password"
              disabled={loading}
              autoFocus
              required
            />
          </div>

          {passwordError && (
            <p className={styles.errorMsg} role="alert">
              {passwordError}
            </p>
          )}

          <p className={styles.reassureCaption}>
            확정 후에도 30일 이내 로그인하면 복구할 수 있어요
          </p>

          <button type="submit" className={styles.confirmBtn} disabled={!isValid() || loading}>
            {loading ? '처리 중...' : '탈퇴 확정'}
          </button>
        </form>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
