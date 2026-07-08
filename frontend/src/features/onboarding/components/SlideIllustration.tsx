'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './SlideIllustration.module.css';

interface SlideIllustrationProps {
  src: string;
  /** true면 next/image priority 로딩 (첫 슬라이드용) */
  priority?: boolean;
}

// Default(이미지) / Loading(스켈레톤) / Error(브랜드 아이콘 플레이스홀더) 3가지 상태.
// 에셋이 아직 없는 지금 상태에서는 next/image가 로컬 파일 로드에 실패하며
// onError가 호출되어 자연스럽게 Error 상태로 표시된다 — 레이아웃 시프트 없이
// 4:5 세로 컨테이너를 그대로 유지한다.
export function SlideIllustration({ src, priority }: SlideIllustrationProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <div className={styles.frame}>
      {status !== 'error' && (
        <Image
          src={src}
          alt=""
          fill
          sizes="260px"
          priority={priority}
          className={status === 'loaded' ? styles.image : styles.imageHidden}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
      {status === 'loading' && <div className={styles.skeleton} aria-hidden="true" />}
      {status === 'error' && (
        <div className={styles.errorState} aria-hidden="true">
          <PawIcon className={styles.errorIcon} />
        </div>
      )}
    </div>
  );
}

function PawIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={40}
      height={40}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="24" cy="30" rx="10" ry="8" fill="#C7C7CC" />
      <circle cx="12" cy="18" r="5" fill="#C7C7CC" />
      <circle cx="24" cy="12" r="5.5" fill="#C7C7CC" />
      <circle cx="36" cy="18" r="5" fill="#C7C7CC" />
    </svg>
  );
}
