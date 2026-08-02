import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Replay 로드를 미루는 상한. 유휴 시점이 오지 않는 바쁜 화면에서도 이 시간 안에는 붙는다.
const REPLAY_IDLE_TIMEOUT_MS = 3000;
// requestIdleCallback이 없는 브라우저(Safari 구버전, 일부 웹뷰)용 폴백 지연.
const REPLAY_FALLBACK_DELAY_MS = 3000;

/**
 * Session Replay(rrweb)를 초기 번들에서 분리해 유휴 시점에 붙인다.
 *
 * replayIntegration을 init의 integrations에 정적으로 넣으면 rrweb 전체가 첫 진입
 * 청크에 실린다. 측정해 보면 /login 초기 JS의 45%(548KB raw / 173KB gzip)가 이
 * 청크였다 — 랜딩과 로그인처럼 아직 로그인도 하지 않은 방문자에게까지 나간다.
 * 게다가 replaysSessionSampleRate가 0.1이라 그중 90%는 한 번도 쓰이지 않는다.
 *
 * CDN에서 받아오는 Sentry의 lazyLoadIntegration은 쓰지 않는다. Petlog는 Capacitor
 * 웹뷰로도 배포되고, 외부 도메인 의존은 그 환경에서 조용히 실패할 여지가 있다.
 * 대신 동적 import로 우리 번들 안에 별도 청크를 만든다.
 *
 * 트레이드오프: Replay가 붙기 전(첫 몇 초)에 발생한 에러에는 리플레이가 남지 않는다.
 * 에러 수집과 트레이싱(Web Vitals 포함)은 init 시점부터 그대로 동작하므로 영향이 없다.
 */
function scheduleReplay(): void {
  const load = () => {
    import('@sentry/nextjs')
      .then(({ replayIntegration }) => {
        Sentry.addIntegration(replayIntegration());
      })
      .catch(() => {
        // Replay는 부가 기능이다. 실패해도 에러 수집·트레이싱은 유지되므로 조용히 넘어간다.
      });
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(load, { timeout: REPLAY_IDLE_TIMEOUT_MS });
  } else {
    window.setTimeout(load, REPLAY_FALLBACK_DELAY_MS);
  }
}

// DSN이 없는 로컬 개발 환경에서는 초기화를 건너뛴다.
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // LCP / CLS / INP(Core Web Vitals)는 여기서 따로 계측하지 않는다. @sentry/nextjs의
    // 기본 integration에 browserTracingIntegration이 포함되고(build/cjs/client/index.js의
    // getDefaultIntegrations), 그것이 webVitalsIntegration을 붙여 pageload 트랜잭션의
    // measurement로 자동 수집한다. 여기서 integrations를 지정하지 않아도 기본값은 그대로다.
    //
    // 다만 수집은 tracesSampleRate에 종속된다. 출시 직후(2026-07)에는 일 방문이 소수라
    // 0.1로 두면 표본이 사실상 0이라 Web Vitals 대시보드가 비어 있게 된다. 데이터를 먼저
    // 쌓는 게 목적이므로 당분간 전량 수집한다.
    // 되돌릴 시점: 월 트랜잭션이 Sentry 무료 쿼터(10K)의 50%를 넘으면 0.2~0.3으로 낮춘다.
    tracesSampleRate: 1.0,
    // 아래 두 샘플링 값은 나중에 addIntegration으로 붙는 replayIntegration이 클라이언트
    // 옵션에서 그대로 읽어간다. 여기 남겨두어야 지연 로드 후에도 표본 비율이 유지된다.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  scheduleReplay();
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
