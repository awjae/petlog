'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLogin } from '@/features/auth/hooks/useLogin';
import styles from './page.module.css';

const SUCCESS_BANNER_DURATION_MS = 3500;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading, error } = useLogin();

  const prefillEmail = searchParams.get('email') ?? '';
  const resetSuccess = searchParams.get('reset') === 'success';

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [showResetBanner, setShowResetBanner] = useState(resetSuccess);

  useEffect(() => {
    if (!resetSuccess) return;
    const timer = setTimeout(() => setShowResetBanner(false), SUCCESS_BANNER_DURATION_MS);
    return () => clearTimeout(timer);
  }, [resetSuccess]);

  function isValid() {
    return email.includes('@') && password.length >= 8;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid()) return;
    const ok = await login(email, password);
    if (ok !== null) router.push('/home');
  }

  const forgotPasswordHref = email
    ? `/forgot-password?email=${encodeURIComponent(email)}`
    : '/forgot-password';

  return (
    <main className={styles.main} aria-label="로그인">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden="true">
            🐾
          </span>
          <h1 className={styles.brandName}>Petlog</h1>
          <p className={styles.brandDesc}>반려동물 건강 기록 서비스</p>
        </div>

        {showResetBanner && (
          <p className={styles.resetBanner} role="status">
            비밀번호가 변경됐어요. 새 비밀번호로 로그인해주세요.
          </p>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@petlog.kr"
              autoComplete="email"
              autoFocus={!resetSuccess}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상"
              autoComplete="current-password"
              autoFocus={resetSuccess}
              required
            />
            <Link href={forgotPasswordHref} className={styles.forgotLink}>
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          {error && (
            <p className={styles.errorMsg} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={styles.submitBtn} disabled={!isValid() || loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className={styles.footer}>
          아직 계정이 없으신가요?{' '}
          <Link href="/register" className={styles.footerLink}>
            회원가입
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className={styles.main} aria-label="로그인" />}>
      <LoginContent />
    </Suspense>
  );
}
