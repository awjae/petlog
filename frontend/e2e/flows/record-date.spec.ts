// Frontend Integration(@integration) — 날짜 입력의 기준 시간대.
//
// 결정 문서: .claude/docs/decisions/013-e2e-vs-frontend-integration-test.md
//
// 여기서 지키는 것은 "새벽에 열어도 오늘 날짜가 기본값이고, 오늘을 선택할 수 있다"는
// 계약이다. 이 판단은 브라우저의 로컬 시간대와 `<input type="date">`의 max 속성에
// 걸려 있어서 타입체크로도, 순수 함수 테스트로도 드러나지 않는다.
//
// shared/utils/date.test.ts가 `localToday()` 자체는 검증하지만, 그건 부품이다.
// 화면이 그 부품을 쓰는지는 확인해주지 않는다 — 실제 버그는 13곳의 호출부가
// `new Date().toISOString().split('T')[0]`을 쓰고 있던 것이었고, 유틸만 고치고
// 호출부 하나를 놓쳐도 유틸 테스트는 그대로 통과한다.
//
// 실제로 이 버그가 만든 증상: KST 00~09시에 기록 화면을 열면 기본 날짜가 어제로
// 잡히고, max도 어제라서 오늘로 고칠 수도 없었다. 구토·설사처럼 새벽에 남기는
// 기록이 통째로 어제 날짜로 저장됐다.
//
// 백엔드 없이 프론트만 떠 있으면 돌아간다. 날짜 기본값은 서버 데이터를 쓰지 않는
// 순수 클라이언트 계산이라, 화면에 도달하기 위한 최소한만 beforeEach에서 세운다.

import { test, expect } from '@playwright/test';

// 브라우저 시간대를 고정한다. 이걸 빼면 실행 머신의 시간대에 따라 결과가 달라져,
// 개발 머신(Asia/Seoul)에서는 통과하고 CI(UTC)에서만 깨지거나 그 반대가 된다.
test.use({ timezoneId: 'Asia/Seoul' });

// 서울 2027-03-15 00:30 (= UTC 2027-03-14 15:30).
// 이 순간의 UTC 날짜는 아직 03-14다. `toISOString()`으로 오늘을 구하면 하루 밀린다.
//
// 실행 시점의 실제 날짜와 겹치지 않는 미래 시각을 고른다. 가짜 시계는 브라우저에만
// 걸리고 SSR은 서버의 실제 시각으로 렌더하므로, 기대값이 실제 오늘과 같으면 SSR 출력이
// 우연히 일치해 하이드레이션을 기다리지 않고 통과해버린다. 실제로 그렇게 만들었다가
// 버그 버전에서도 max 단정이 통과하는 것을 보고 이 시각으로 바꿨다.
//
// 두 후보값(로컬 기준 03-15 / UTC 기준 03-14) 모두 실제 오늘이 아니므로, 단정은
// 하이드레이션이 끝나 클라이언트 계산이 반영된 뒤에만 만족될 수 있다.
const SEOUL_DAWN = new Date('2027-03-14T15:30:00Z');
const SEOUL_TODAY = '2027-03-15';

test.describe('날짜 입력의 기준 시간대 @integration', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // src/proxy.ts(Next 미들웨어)는 access_token 쿠키의 "존재 여부"만 본다.
    await page
      .context()
      .addCookies([
        { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
      ]);

    // 공용 레이어의 GraphQL이 인증 오류로 떨어지면 errorLink가 /login으로 날려버려
    // 검증할 폼에 도달하지 못한다. 빈 성공으로 막는다.
    await page.route('**/api/graphql', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{}}' }),
    );

    // 페이지 스크립트가 Date를 읽기 전에 고정해야 한다.
    await page.clock.setFixedTime(SEOUL_DAWN);
  });

  test('새벽에 기록 화면을 열면 기본 날짜가 오늘이다', async ({ page }) => {
    await page.goto('/records/new');

    // 이 단정은 하이드레이션 후 클라이언트 계산이 반영돼야만 만족된다.
    // `not.toHaveValue(어제)`는 쓰지 않는다 — 리트라이 의미상 "아직 비어 있는" 순간에도
    // 통과해버려서 하이드레이션 이전 상태를 통과로 오해한다.
    await expect(page.getByLabel('기록 날짜')).toHaveValue(SEOUL_TODAY);
  });

  // max는 제어 prop이 아니라 일반 속성이라, React 하이드레이션이 서버 HTML을 그대로 둔다.
  // 즉 첫 페인트의 max는 서버 시계로 계산된 값이고, 클라이언트 계산이 반영되는 시점은
  // 마운트 이후 첫 리렌더다. 그래서 상호작용을 한 번 준 뒤에 확인한다.
  //
  // 첫 페인트의 max가 서버 시간대를 따르는 문제는 이 PR 범위를 넘는다 — 작업 보고 참고.
  test('상호작용 후 max가 클라이언트 기준 오늘로 갱신된다', async ({ page }) => {
    await page.goto('/records/new');
    await expect(page.getByLabel('기록 날짜')).toHaveValue(SEOUL_TODAY);

    // 기록 유형을 바꾸면 상태가 변해 리렌더가 일어난다.
    await page.getByRole('button', { name: '식사' }).click();

    await expect(page.getByLabel('기록 날짜')).toHaveAttribute('max', SEOUL_TODAY);
  });

  test('반려동물 생년월일도 상호작용 후 오늘까지 선택할 수 있다', async ({ page }) => {
    await page.goto('/pets/new');

    await page.getByLabel('이름', { exact: false }).first().fill('초코');

    await expect(page.getByLabel(/생년월일/)).toHaveAttribute('max', SEOUL_TODAY);
  });
});
