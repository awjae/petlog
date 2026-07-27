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
export async function syncNativeStatusBar(mode: 'light' | 'dark'): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: mode === 'dark' ? Style.Dark : Style.Light });
  } catch {
    // 플러그인이 없는 빌드나 지원하지 않는 플랫폼에서 실패해도
    // 화면 자체는 정상 동작해야 하므로 조용히 넘어간다.
  }
}
