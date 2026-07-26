'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApolloClient } from '@apollo/client/react';
import {
  PawPrint,
  Check,
  Bell,
  Syringe,
  Stethoscope,
  KeyRound,
  LogOut,
  ChevronRight,
  Shield,
  FileText,
  Megaphone,
} from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { BottomNav } from '@/features/shared/components/BottomNav';
import { EditProfileModal } from '@/features/settings/components/EditProfileModal';
import { WithdrawInfoSheet } from '@/features/settings/components/WithdrawInfoSheet';
import { useCurrentUser } from '@/features/settings/hooks/useCurrentUser';
import { useSelectedPetStore } from '@/features/pet/stores/selectedPet.store';
import { useToast, ToastContainer } from '@/features/shared/components/Toast';
import { version } from '../../../package.json';
import styles from './page.module.css';
import { useSendTestPushNotification } from '@/features/notification/hooks/useSendTestPushNotification';
import { useNotificationPreference } from '@/features/notification/hooks/useNotificationPreference';
import { useMarketingConsent } from '@/features/consent/hooks/useMarketingConsent';

const THEMES = [
  { value: 'pastel-sky' as const, label: '파스텔 스카이', preview: '#6baed6' },
  { value: 'pastel-pink' as const, label: '파스텔 핑크', preview: '#d4728a' },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const client = useApolloClient();
  const { theme, setTheme } = useTheme();
  const { name, email, loading } = useCurrentUser();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isWithdrawSheetOpen, setIsWithdrawSheetOpen] = useState(false);
  const { toasts, addToast, dismiss } = useToast();
  const {
    sendTestPushNotification,
    loading: sendingTestPush,
    error: testPushError,
  } = useSendTestPushNotification();
  const {
    preference,
    loading: preferenceLoading,
    updating: preferenceUpdating,
    updatePreference,
  } = useNotificationPreference();
  const {
    agreed: marketingAgreed,
    loading: marketingLoading,
    updateMarketingConsent,
  } = useMarketingConsent();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    useSelectedPetStore.getState().reset();
    await client.clearStore();
    router.push('/login');
  }

  async function handleSendTestPush() {
    const ok = await sendTestPushNotification();
    if (ok) addToast('테스트 알림을 보냈습니다', 'success');
  }

  function handleToggleMarketing() {
    updateMarketingConsent(!marketingAgreed, (ok) => {
      if (!ok) addToast('설정을 변경하지 못했어요', 'error');
    });
  }

  return (
    <main className={styles.main} aria-label="설정">
      <header className={styles.header}>
        <h1 className={styles.title}>설정</h1>
      </header>

      <div className={styles.content}>
        {/* ── 프로필 ── */}
        <section className={styles.section}>
          <div className={styles.profileCard}>
            <div className={styles.profileAvatar} aria-hidden="true">
              <PawPrint size={24} strokeWidth={1.5} />
            </div>
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>
                {loading ? '불러오는 중...' : (name ?? '보호자')}
              </p>
              <p className={styles.profileEmail}>{loading ? '' : email}</p>
            </div>
            <button
              className={styles.editBtn}
              aria-label="프로필 편집"
              onClick={() => setIsEditOpen(true)}
              disabled={loading}
            >
              편집
            </button>
          </div>
        </section>

        {/* ── 앱 테마 ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>앱 테마</h2>
          <div className={styles.themeGrid} role="group" aria-label="테마 선택">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`${styles.themeBtn} ${theme === t.value ? styles.themeBtnActive : ''}`}
                onClick={() => setTheme(t.value)}
                aria-pressed={theme === t.value}
              >
                <span
                  className={styles.themeColor}
                  style={{ background: t.preview }}
                  aria-hidden="true"
                />
                <span className={styles.themeLabel}>{t.label}</span>
                {theme === t.value && (
                  <span className={styles.themeCheck} aria-hidden="true">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ── 알림 ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>알림</h2>
          <div className={styles.listCard}>
            <div className={styles.listItem}>
              <Syringe
                size={18}
                strokeWidth={1.75}
                className={styles.listIcon}
                aria-hidden="true"
              />
              <span className={styles.listLabel}>예방접종 알림</span>
              <button
                type="button"
                role="switch"
                aria-checked={preference?.vaccinationDueEnabled ?? true}
                aria-label="예방접종 알림"
                className={`${styles.switch} ${(preference?.vaccinationDueEnabled ?? true) ? styles.switchOn : ''}`}
                disabled={preferenceLoading || preferenceUpdating}
                onClick={() =>
                  updatePreference({
                    vaccinationDueEnabled: !(preference?.vaccinationDueEnabled ?? true),
                  })
                }
              >
                <span className={styles.switchKnob} aria-hidden="true" />
              </button>
            </div>
            <div className={styles.divider} />
            <div className={styles.listItem}>
              <Stethoscope
                size={18}
                strokeWidth={1.75}
                className={styles.listIcon}
                aria-hidden="true"
              />
              <span className={styles.listLabel}>병원 방문 알림</span>
              <button
                type="button"
                role="switch"
                aria-checked={preference?.appointmentReminderEnabled ?? true}
                aria-label="병원 방문 알림"
                className={`${styles.switch} ${(preference?.appointmentReminderEnabled ?? true) ? styles.switchOn : ''}`}
                disabled={preferenceLoading || preferenceUpdating}
                onClick={() =>
                  updatePreference({
                    appointmentReminderEnabled: !(preference?.appointmentReminderEnabled ?? true),
                  })
                }
              >
                <span className={styles.switchKnob} aria-hidden="true" />
              </button>
            </div>
            <div className={styles.divider} />
            <div className={styles.listItem}>
              <Bell size={18} strokeWidth={1.75} className={styles.listIcon} aria-hidden="true" />
              <span className={styles.listLabel}>건강기록 권장 알림</span>
              <button
                type="button"
                role="switch"
                aria-checked={preference?.weeklyCheckinEnabled ?? true}
                aria-label="건강기록 권장 알림"
                className={`${styles.switch} ${(preference?.weeklyCheckinEnabled ?? true) ? styles.switchOn : ''}`}
                disabled={preferenceLoading || preferenceUpdating}
                onClick={() =>
                  updatePreference({
                    weeklyCheckinEnabled: !(preference?.weeklyCheckinEnabled ?? true),
                  })
                }
              >
                <span className={styles.switchKnob} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Firebase push 알림 테스트 UI */}
          {false && (
            <button
              type="button"
              className={styles.testPushBtn}
              onClick={handleSendTestPush}
              disabled={sendingTestPush}
            >
              <Bell size={16} strokeWidth={2} aria-hidden="true" />
              {sendingTestPush ? '전송 중...' : '테스트 알림 보내기'}
            </button>
          )}
          {testPushError && <p className={styles.testPushError}>{testPushError}</p>}
        </section>

        {/* ── 약관 및 동의 ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>약관 및 동의</h2>
          <div className={styles.listCard}>
            <Link href="/terms" className={styles.listItem}>
              <FileText
                size={18}
                strokeWidth={1.75}
                className={styles.listIcon}
                aria-hidden="true"
              />
              <span className={styles.listLabel}>이용약관</span>
              <ChevronRight
                size={16}
                strokeWidth={2}
                className={styles.chevron}
                aria-hidden="true"
              />
            </Link>
            <div className={styles.divider} />
            <Link href="/privacy" className={styles.listItem}>
              <Shield size={18} strokeWidth={1.75} className={styles.listIcon} aria-hidden="true" />
              <span className={styles.listLabel}>개인정보처리방침</span>
              <ChevronRight
                size={16}
                strokeWidth={2}
                className={styles.chevron}
                aria-hidden="true"
              />
            </Link>
            <div className={styles.divider} />
            <div className={styles.listItem}>
              <Megaphone
                size={18}
                strokeWidth={1.75}
                className={styles.listIcon}
                aria-hidden="true"
              />
              <span className={styles.listLabel}>마케팅 정보 수신 동의</span>
              <button
                type="button"
                role="switch"
                aria-checked={marketingAgreed}
                aria-label="마케팅 정보 수신 동의"
                className={`${styles.switch} ${marketingAgreed ? styles.switchOn : ''}`}
                disabled={marketingLoading}
                onClick={handleToggleMarketing}
              >
                <span className={styles.switchKnob} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        {/* ── 계정 ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>계정</h2>
          <div className={styles.listCard}>
            <button className={styles.listItem} disabled>
              <KeyRound
                size={18}
                strokeWidth={1.75}
                className={styles.listIcon}
                aria-hidden="true"
              />
              <span className={styles.listLabel}>비밀번호 변경</span>
              <ChevronRight
                size={16}
                strokeWidth={2}
                className={styles.chevron}
                aria-hidden="true"
              />
            </button>
            <div className={styles.divider} />
            <button className={styles.listItemDanger} onClick={handleLogout}>
              <LogOut size={18} strokeWidth={1.75} className={styles.listIcon} aria-hidden="true" />
              <span className={styles.listLabelDanger}>로그아웃</span>
            </button>
          </div>
        </section>

        {/* ── 회원 탈퇴 (오탭 방지를 위해 카드 바깥에 저강도로 배치) ── */}
        <button
          type="button"
          className={styles.withdrawBtn}
          onClick={() => setIsWithdrawSheetOpen(true)}
        >
          회원 탈퇴
        </button>

        <p className={styles.contact}>문의: aw.js.share@gmail.com</p>
        <p className={styles.version}>Petlog v{version}</p>
      </div>

      <BottomNav />

      <EditProfileModal
        isOpen={isEditOpen}
        currentName={name}
        onClose={() => setIsEditOpen(false)}
      />

      <WithdrawInfoSheet
        isOpen={isWithdrawSheetOpen}
        onClose={() => setIsWithdrawSheetOpen(false)}
        onProceed={() => {
          setIsWithdrawSheetOpen(false);
          router.push('/settings/withdraw');
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
