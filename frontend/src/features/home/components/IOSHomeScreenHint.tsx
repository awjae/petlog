'use client';

import { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';
import { isIOSBrowser } from '@/shared/native/isNativeApp';
import styles from './IOSHomeScreenHint.module.css';

const DISMISS_KEY = 'petlog-ios-home-hint-dismissed';

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

/**
 * iPhone 사용자에게 "홈 화면에 추가"를 안내한다. iOS 앱이 없어서 iPhone 사용자는 북마크 말고는
 * 다시 들어올 경로가 없다. 홈 화면 아이콘은 재방문의 가장 강한 계기이고, 추가하면 매니페스트의
 * standalone으로 앱처럼 열린다.
 *
 * 기록을 남긴 뒤의 홈(phase 2+)에서만 보여준다 — 아직 가치를 못 본 첫 방문에 설치를 권하면
 * 닫고 끝난다. 한 번 닫으면 다시 띄우지 않는다.
 */
export function IOSHomeScreenHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) !== null;
    } catch {
      // 저장소를 못 쓰면 보여주되, 닫기는 이번 화면에서만 유지된다.
    }
    setVisible(isIOSBrowser() && !isStandalone() && !dismissed);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // 무시
    }
  }

  if (!visible) return null;

  return (
    <div className={styles.hint} role="note" aria-label="홈 화면에 추가 안내">
      <button type="button" className={styles.dismiss} onClick={dismiss} aria-label="닫기">
        <X size={16} strokeWidth={2} aria-hidden="true" />
      </button>
      <p className={styles.title}>홈 화면에 추가하면 앱처럼 쓸 수 있어요</p>
      <p className={styles.body}>
        Safari 아래쪽 <Share size={14} strokeWidth={2} aria-label="공유" className={styles.icon} />{' '}
        버튼을 누르고 &apos;홈 화면에 추가&apos;를 선택하세요.
      </p>
    </div>
  );
}
