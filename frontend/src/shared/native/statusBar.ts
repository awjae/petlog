/**
 * 네이티브 앱(Capacitor)의 상태 표시줄을 앱의 명암 모드에 맞춘다.
 *
 * 왜 배경색이 아니라 스타일만 바꾸는가:
 * 이 앱은 targetSdk 35(Android 15)의 edge-to-edge 위에서 동작한다
 * (mobile/android/.../styles.xml 참고). 상태 표시줄이 웹뷰 위에 겹쳐지므로 배경은
 * 이미 페이지가 그린 --color-bg 이고, StatusBar.setBackgroundColor 는 효과가 없다.
 * 실제로 문제가 되는 건 아이콘/시계의 색이다 — 다크 모드에서 어두운 아이콘이 남으면
 * 어두운 배경 위에서 보이지 않는다.
 *
 * Style 의미(@capacitor/status-bar):
 * - Style.Dark  = 어두운 배경용 → 밝은(흰) 아이콘
 * - Style.Light = 밝은 배경용   → 어두운(검은) 아이콘
 *
 * 웹 브라우저에서는 아무 동작도 하지 않는다.
 */

/**
 * 마지막으로 요청된 모드. 사용자가 설정에서 모드를 빠르게 바꾸면 setStyle 두 번이
 * 겹치는데, 네이티브 브리지가 호출 순서대로 끝나는 걸 보장하지 않는다. 먼저 보낸
 * 요청이 나중에 끝나면 상태 표시줄만 반대로 남으므로, 완료 시점에 "내가 아직
 * 마지막 요청인가"를 확인한다.
 */
let latestRequestedMode: 'light' | 'dark' | null = null;

export async function syncNativeStatusBar(mode: 'light' | 'dark'): Promise<void> {
  latestRequestedMode = mode;

  let StatusBar: typeof import('@capacitor/status-bar').StatusBar;
  let Style: typeof import('@capacitor/status-bar').Style;

  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    ({ StatusBar, Style } = await import('@capacitor/status-bar'));
  } catch {
    // 플러그인이 빠진 빌드나 지원하지 않는 플랫폼이다. 화면 자체는 정상 동작해야
    // 하므로 여기서는 조용히 넘어간다 — "쓸 수 없는 환경"이지 오류가 아니다.
    return;
  }

  // 모듈을 불러오는 사이에 더 최근 요청이 들어왔으면 이 호출은 버린다.
  if (latestRequestedMode !== mode) return;

  try {
    await StatusBar.setStyle({ style: mode === 'dark' ? Style.Dark : Style.Light });
  } catch (error) {
    // 여기까지 왔다면 플러그인은 있는데 호출이 실패한 것이다. 삼키면 기기에서
    // 원인을 찾을 방법이 없으므로 남긴다(화면 동작에는 영향을 주지 않는다).
    console.warn('[statusBar] 상태 표시줄 스타일 적용 실패', error);
  }
}
