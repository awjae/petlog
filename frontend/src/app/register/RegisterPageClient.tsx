'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useRegister } from '@/features/auth/hooks/useRegister';
import { AgreementSection } from '@/features/auth/components/AgreementSection';
import type { RegisterConsents } from '@/features/auth/types/auth.types';
import styles from './page.module.css';

const INITIAL_CONSENTS: RegisterConsents = {
  termsOfService: false,
  privacyPolicy: false,
  marketingNotification: false,
};

export function RegisterPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [consents, setConsents] = useState<RegisterConsents>(INITIAL_CONSENTS);
  const { loading, error, register } = useRegister();

  function isValid() {
    return (
      email.includes('@') &&
      password.length >= 8 &&
      consents.termsOfService &&
      consents.privacyPolicy
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid()) return;
    const ok = await register(email, password, consents);
    // /home 진입 시 OnboardingOverlay가 hasCompletedOnboarding() 여부를 스스로 판단해
    // 노출 여부를 결정하므로, 여기서는 항상 /home으로 보내면 된다.
    if (ok !== null) router.push('/home');
  }

  return (
    <main className={styles.main} aria-label="회원가입">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>회원가입</h1>
        <div className={styles.headerRight} aria-hidden="true" />
      </header>

      <div className={styles.inner}>
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
              autoFocus
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">
              비밀번호
            </label>
            {/* 확인 칸 대신 "보기" 토글을 둔다. 모바일에서 같은 비밀번호를 두 번 치는 것은
                가입 이탈의 흔한 원인이고, 오타는 눈으로 확인하는 편이 더 확실하다.
                잊어버려도 비밀번호 재설정(/forgot-password)이 있다. */}
            <div className={styles.passwordRow}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`${styles.input} ${password && password.length < 8 ? styles.inputError : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((v) => !v)}
                aria-label="비밀번호 보기"
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff size={20} strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <Eye size={20} strokeWidth={1.75} aria-hidden="true" />
                )}
              </button>
            </div>
            {password && password.length < 8 && (
              <p className={styles.fieldError}>8자 이상 입력해주세요</p>
            )}
          </div>

          <AgreementSection values={consents} onChange={setConsents} />

          {error && (
            <p className={styles.errorMsg} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={styles.submitBtn} disabled={!isValid() || loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className={styles.footer}>
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className={styles.footerLink}>
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
