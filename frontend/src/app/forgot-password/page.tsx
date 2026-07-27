'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';
import styles from './page.module.css';
import { AppLogo } from '@/shared/components/AppLogo';

type Phase = 'form' | 'sent';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const { loading, error, requestReset } = useForgotPassword();

  const [phase, setPhase] = useState<Phase>('form');
  const [animClass, setAnimClass] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [sentEmail, setSentEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const sentTitleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function isValidEmail(value: string) {
    return value.includes('@');
  }

  function switchTo(next: Phase) {
    const reduced = prefersReducedMotion();
    const exitMs = reduced ? 160 : 140;
    const enterMs = reduced ? 160 : 220;

    setAnimClass(styles.animExit);
    window.setTimeout(() => {
      if (next === 'form') setEmail('');
      setPhase(next);
      setAnimClass(styles.animEnterStart);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimClass(styles.animEnterEnd);
          window.setTimeout(() => {
            setAnimClass('');
            if (next === 'sent') sentTitleRef.current?.focus();
          }, enterMs);
        });
      });
    }, exitMs);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email) || loading) return;
    const res = await requestReset(email);
    if (res !== null) {
      setSentEmail(email);
      setCooldown(60);
      switchTo('sent');
    }
  }

  async function handleResend() {
    setCooldown(60);
    const res = await requestReset(sentEmail);
    if (res === null) {
      setCooldown(0);
    }
  }

  return (
    <main className={styles.main} aria-label="비밀번호 찾기">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden="true">
            <AppLogo priority />
          </span>
          <h1 className={styles.brandName}>Petlog</h1>
          <p className={styles.brandDesc}>반려동물 건강 기록 서비스</p>
        </div>

        <div className={styles.swapArea} aria-live="polite">
          <div className={`${styles.content} ${animClass}`}>
            {phase === 'form' ? (
              <>
                <p className={styles.instruction}>
                  가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드려요.
                </p>
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

                  {error && (
                    <p className={styles.errorMsg} role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={!isValidEmail(email) || loading}
                  >
                    {loading ? '보내는 중...' : '재설정 링크 보내기'}
                  </button>
                </form>
              </>
            ) : (
              <div className={styles.sentState}>
                <div className={styles.sentIcon} aria-hidden="true">
                  <MailCheck size={25} strokeWidth={2} />
                </div>
                <h2 className={styles.sentTitle} tabIndex={-1} ref={sentTitleRef}>
                  이메일을 확인해주세요
                </h2>
                <p className={styles.sentDesc}>
                  아래 주소로 재설정 링크를 보냈어요.
                  <br />
                  <strong className={styles.sentEmail}>{sentEmail}</strong>
                </p>

                <button
                  type="button"
                  className={styles.resendBtn}
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                >
                  {cooldown > 0 ? `재전송 (${cooldown}초)` : '재전송'}
                </button>

                {error && (
                  <p className={styles.errorMsg} role="alert">
                    {error}
                  </p>
                )}

                <button type="button" className={styles.retryLink} onClick={() => switchTo('form')}>
                  다른 이메일로 시도
                </button>
              </div>
            )}
          </div>
        </div>

        <p className={styles.footer}>
          <Link href="/login" className={styles.footerLink}>
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<main className={styles.main} aria-label="비밀번호 찾기" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
