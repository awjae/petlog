// TODO(다음 단계): Frontend Integration(@integration) 테스트용 MSW handler override 유틸.
//
// 이번 작업 범위는 E2E(인증 흐름) 우선이라 실제 구현은 다음 단계로 미룬다. 여기서는
// 확정된 방향만 남겨둔다.
//
// 배경:
// - frontend/src/mocks/handlers/*.ts(medical, health-record, calendar, home, auth)에 이미
//   MSW 핸들러가 존재한다. 단, 지금은 브라우저 Service Worker(NEXT_PUBLIC_USE_MOCK=true)로
//   "개발 모드 목업"에만 쓰이고 있고, Playwright 테스트 하네스에는 아직 연결돼 있지 않다.
// - 이 핸들러들은 msw의 `http`/`graphql` 헬퍼로 이미 작성돼 있어 `msw/node`의
//   `setupServer(...)`로도 그대로 재사용 가능한 구조다 — 처음부터 새로 만들 필요 없음.
//
// 예정된 구현 방향:
// 1. Playwright의 각 브라우저 페이지가 실제로 보내는 GraphQL 요청을 가로채려면, MSW를
//    Node 프로세스(Playwright 테스트 프로세스)가 아니라 "브라우저 안"에서 가로채야 한다.
//    → NEXT_PUBLIC_USE_MOCK=true로 띄운 프론트가 이미 MSWProvider로 Service Worker를
//      구동하므로, integration 프로젝트는 이 모드로 프론트를 띄운 상태를 전제로 한다.
// 2. 테스트별로 특정 시나리오(빈 상태/에러 상태 등)를 재현하려면 기본 핸들러를 일시적으로
//    override해야 한다. MSW 브라우저 워커는 `worker.use(...)`로 런타임 override를 지원하는데,
//    Playwright 테스트(Node 컨텍스트)에서 브라우저 안의 worker.use를 직접 호출할 수 없으므로
//    `page.evaluate()`로 브라우저 컨텍스트에 진입해 트리거하거나, 오버라이드 시나리오 이름을
//    쿼리 파라미터/헤더로 페이지에 전달해 앱 부트스트랩 코드가 조건부로 다른 핸들러 세트를
//    등록하게 하는 방식 중 하나를 선택해야 한다 — 이 결정은 다음 단계에서 실제 spec을
//    작성하며 확정한다.
//
// 예상 시그니처(확정 아님):
// export async function overrideGraphqlHandler(
//   page: Page,
//   operationName: string,
//   scenario: 'empty' | 'error' | ...,
// ): Promise<void> { ... }

export {};
