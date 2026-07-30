'use client';

import { useEffect, useState } from 'react';
import { localToday } from '@/shared/utils/date';

/**
 * `<input type="date">`의 `max`에 넣을 "오늘"(로컬 기준). SSR 중에는 `undefined`다.
 *
 * `max={localToday()}`처럼 렌더 중에 직접 계산하면 안 된다. `max`는 React가 관리하는
 * 제어 prop이 아니라 일반 속성이라, **하이드레이션에서 서버 HTML을 그대로 둔다.**
 * 서버(배포 환경 TZ=UTC)와 클라이언트(KST)의 계산 결과가 다른 새벽 시간대에는
 * 서버 값이 DOM에 남고, 사용자는 오늘을 선택할 수 없다.
 *
 * 게다가 이후 리렌더로도 고쳐지지 않는다. React의 내부 기록은 하이드레이션 때 계산한
 * 클라이언트 값이고 DOM만 서버 값이므로, 다음 렌더에서 값이 같다고 판단해 DOM에
 * 쓰지 않는다. 즉 한 번 어긋나면 영구히 어긋난다.
 *
 * 그래서 SSR에서는 속성을 아예 렌더하지 않고(undefined), 마운트 후 effect로 넣는다.
 * 첫 프레임에 max가 없는 구간이 생기지만, "미래 날짜를 막는" 클라이언트 편의 장치일
 * 뿐이고 서버가 별도로 검증하므로 하루 어긋난 max를 남기는 것보다 안전하다.
 *
 * 마운트 게이트 뒤에서만 렌더되는 오버레이(DatePickerSheet 등)는 SSR을 타지 않으므로
 * 이 훅이 필요 없다.
 */
export function useLocalToday(): string | undefined {
  const [today, setToday] = useState<string>();

  useEffect(() => {
    setToday(localToday());
  }, []);

  return today;
}
