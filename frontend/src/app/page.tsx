import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { JsonLd } from '@/shared/components/JsonLd';
import { SITE_NAME, SITE_URL } from '@/shared/config/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: '반려동물 건강 기록 · AI 건강 리포트',
  description:
    '체중, 식사, 활동량을 간편하게 기록하고 AI 리포트로 반려동물의 건강 변화를 파악해보세요. 흩어진 병원 기록과 건강 정보를 한곳에서 관리하는 반려동물 건강 기록 서비스.',
};

const landingJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web, iOS, Android',
  description:
    '반려동물의 체중, 식사, 활동량 등 건강 데이터를 기록하고 AI 기반 건강 리포트로 변화를 이해할 수 있도록 돕는 모바일 우선 건강 기록 서비스.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
  },
};

export default function LandingPage() {
  return (
    <main className={styles.landing} aria-label="Petlog 소개">
      <JsonLd data={landingJsonLd} />
      <span className={styles.landingIcon} aria-hidden="true">
        <Image src="/main-logo.png" alt="" width={64} height={64} priority />
      </span>
      <h1 className={styles.landingTitle}>반려동물 건강 기록</h1>
      <p className={styles.landingDesc}>
        체중, 식사, 활동량을 간편하게 기록하고
        <br />
        AI 리포트로 건강 변화를 파악해보세요.
      </p>
      <Link href="/register" className={styles.landingCta}>
        무료로 시작하기
      </Link>
      <Link href="/login" className={styles.landingLogin}>
        이미 계정이 있어요 <span>로그인</span>
      </Link>
    </main>
  );
}
