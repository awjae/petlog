/**
 * 이 환경에서 브라우저 인쇄(= PDF로 저장)를 쓸 수 있는가.
 *
 * Android WebView는 window.print()를 구현하지 않는다 — 함수는 존재하지만 아무 일도
 * 일어나지 않는다. 네이티브에서 createPrintDocumentAdapter를 배선해야 동작하므로
 * 앱 재배포 없이는 켤 수 없다. 버튼을 눌렀는데 아무 반응이 없는 것이 가장 나쁜
 * 경험이라, 되는 환경에서만 버튼을 내보낸다.
 *
 * 동기 함수인 이유: 다른 네이티브 연동(statusBar 등)은 플러그인을 동적 import 해야
 * 해서 비동기지만, 여기서는 Capacitor가 주입하는 전역만 보면 된다. 첫 렌더에 값이
 * 필요한 판정이라 비동기로 만들면 버튼이 깜빡인다.
 */
export function canPrint(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.print !== 'function') return false;

  const capacitor = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !capacitor?.isNativePlatform?.();
}
