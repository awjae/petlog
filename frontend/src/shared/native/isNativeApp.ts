/**
 * Capacitor 앱(WebView) 안에서 실행 중인가. 앱은 server.url로 같은 웹을 띄우므로
 * "앱 설치" 안내처럼 웹 방문자에게만 의미 있는 UI를 가릴 때 쓴다.
 * 판정 방식은 canPrint와 같다 — Capacitor가 주입하는 전역만 본다.
 */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const capacitor = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return capacitor?.isNativePlatform?.() === true;
}

/** iOS 기기(iPhone·iPad)의 브라우저인가. iPadOS 13+는 Mac으로 위장하므로 터치 지원으로 가린다. */
export function isIOSBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}
