import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// DSN이 없는 로컬 개발 환경에서는 초기화를 건너뛴다.
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // LCP / CLS / INP(Core Web Vitals)는 여기서 따로 계측하지 않는다. @sentry/nextjs의
    // 기본 integration에 browserTracingIntegration이 포함되고(build/cjs/client/index.js의
    // getDefaultIntegrations), 그것이 webVitalsIntegration을 붙여 pageload 트랜잭션의
    // measurement로 자동 수집한다. 아래 integrations 배열은 기본값을 "대체"하는 게 아니라
    // 병합되므로 replayIntegration을 추가해도 트레이싱은 그대로 살아 있다.
    //
    // 다만 수집은 tracesSampleRate에 종속된다. 출시 직후(2026-07)에는 일 방문이 소수라
    // 0.1로 두면 표본이 사실상 0이라 Web Vitals 대시보드가 비어 있게 된다. 데이터를 먼저
    // 쌓는 게 목적이므로 당분간 전량 수집한다.
    // 되돌릴 시점: 월 트랜잭션이 Sentry 무료 쿼터(10K)의 50%를 넘으면 0.2~0.3으로 낮춘다.
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.replayIntegration()],
    // 기본 트랜스포트는 전송에 실패한 이벤트를 그냥 버린다. 그러면 "오프라인이라 저장에
    // 실패했다"는 신고 자체가 오프라인이라 못 나가고 사라진다 — 정작 알고 싶은 오프라인
    // 수치만 구조적으로 과소집계된다. 이 트랜스포트는 실패한 이벤트를 IndexedDB에
    // 쌓아뒀다가 연결이 돌아오면 다시 보낸다(기본 큐 30건, DB명 sentry-offline).
    transport: Sentry.makeBrowserOfflineTransport(),
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
