'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Link2Off } from 'lucide-react';
import Image from 'next/image';
import { useVerifyResetToken, useResetPassword } from '@/features/auth/hooks/useResetPassword';
import styles from './page.module.css';

type Phase = 'checking' | 'valid' | 'invalid';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { verify } = useVerifyResetToken();
  const { loading, error, tokenInvalid, resetPassword } = useResetPassword();

  const [phase, setPhase] = useState<Phase>('checking');
  const [showSpinner, setShowSpinner] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (!token) {
      setPhase('invalid');
      return;
    }

    let cancelled = false;
    const spinnerTimer = window.setTimeout(() => {
      if (!cancelled) setShowSpinner(true);
    }, 500);

    verify(token).then((valid) => {
      if (cancelled) return;
      window.clearTimeout(spinnerTimer);
      setShowSpinner(false);
      setPhase(valid ? 'valid' : 'invalid');
    });

    return () => {
      cancelled = true;
      window.clearTimeout(spinnerTimer);
    };
    // token 검증은 최초 마운트 시 한 번만 수행한다.
  }, []);

  useEffect(() => {
    if (tokenInvalid) setPhase('invalid');
  }, [tokenInvalid]);

  function isValid() {
    return password.length >= 8 && password === confirm;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid() || loading) return;
    const res = await resetPassword(token, password);
    if (res !== null) router.push('/login?reset=success');
  }

  if (phase === 'checking') {
    return (
      <main className={styles.main} aria-label="비밀번호 재설정">
        <div className={styles.inner}>
          <div className={styles.brand}>
            <span className={styles.brandIcon} aria-hidden="true">
              <Image src="/main-logo.png" alt="" data-logo width={56} height={56} priority />
            </span>
            <h1 className={styles.brandName}>Petlog</h1>
          </div>

          {showSpinner && (
            <div className={styles.checkingState}>
              <div
                className={styles.spinner}
                role="status"
                aria-live="polite"
                aria-label="확인 중"
              />
              <p className={styles.checkingText}>링크를 확인하고 있어요</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (phase === 'invalid') {
    return (
      <main className={styles.main} aria-label="비밀번호 재설정">
        <div className={styles.inner}>
          <div className={styles.brand}>
            <span className={styles.brandIcon} aria-hidden="true">
              <Image src="/main-logo.png" alt="" data-logo width={56} height={56} priority />
            </span>
            <h1 className={styles.brandName}>Petlog</h1>
          </div>

          <div className={styles.invalidState}>
            <div className={styles.invalidBadge} aria-hidden="true">
              <Link2Off size={26} strokeWidth={2} />
            </div>
            <h2 className={styles.invalidTitle}>이 링크는 더 이상 사용할 수 없어요</h2>
            <p className={styles.invalidDesc}>링크가 만료되었거나 이미 사용되었어요.</p>

            <button
              type="button"
              className={styles.submitBtn}
              onClick={() => router.push('/forgot-password')}
            >
              재설정 다시 요청하기
            </button>
            <Link href="/login" className={styles.secondaryLink}>
              로그인해보세요
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main} aria-label="비밀번호 재설정">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden="true">
            <Image src="/main-logo.png" alt="" data-logo width={56} height={56} priority />
          </span>
          <h1 className={styles.brandName}>Petlog</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">
              새 비밀번호
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상"
              autoComplete="new-password"
              autoFocus
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="confirm">
              새 비밀번호 확인
            </label>
            <input
              id="confirm"
              type="password"
              className={`${styles.input} ${confirm && password !== confirm ? styles.inputError : ''}`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="비밀번호를 한 번 더 입력해주세요"
              autoComplete="new-password"
              required
            />
            {confirm && password !== confirm && (
              <p className={styles.fieldError}>비밀번호가 일치하지 않아요</p>
            )}
          </div>

          {error && (
            <p className={styles.errorMsg} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={styles.submitBtn} disabled={!isValid() || loading}>
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className={styles.main} aria-label="비밀번호 재설정" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
