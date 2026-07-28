// Frontend Integration(@integration) — 반려동물 등록 화면.
//
// 결정 문서: .claude/docs/decisions/013-e2e-vs-frontend-integration-test.md
//           .claude/docs/decisions/032-upload-image-format-jpeg.md
//
// 여기서 지키는 것은 "사진을 고른 순간 올릴 수 있는 파일인지 판단한다"는 계약이다.
// 이 판단은 브라우저의 이미지 디코더 지원 여부에 달려 있어서 타입체크로도, 순수 함수
// 테스트로도 드러나지 않는다(vitest.config.ts가 그 러너를 순수 함수 전용으로 못박은
// 이유이기도 하다). 실제 브라우저에서만 확인할 수 있다.
//
// 실제로 이 테스트가 필요했던 이유: 업로드 전 압축을 webp로만 인코딩하도록 만들었다가
// Safari에서 반려동물 등록이 통째로 막혔다. Chromium에서만 검증했기 때문에 머지될 때까지
// 아무도 몰랐다.
//
// 백엔드 없이 프론트만 떠 있으면 돌아간다. 사진 선택은 제출 전까지 네트워크를 타지 않는
// 순수 클라이언트 동작이라, 화면에 도달하기 위한 최소한만 아래 beforeEach에서 세운다.
// authenticatedPage 픽스처(실제 백엔드로 발급받은 storageState)를 쓰지 않는 이유도
// 같다 — 인증은 이 테스트의 검증 대상이 아니고, 그건 auth.spec.ts(@e2e)가 맡는다.

import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';

const NEW_PET_PATH = '/pets/new';

// sips로 만든 64px 이미지. HEIC는 아이폰 사진의 기본 포맷이고, Chromium은 HEVC 라이선스
// 문제로 디코더가 없어 이 파일을 열지 못한다. 그 상황을 재현하는 것이 목적이므로 내용이
// 아니라 "실제 HEIC 컨테이너"라는 점이 중요하다 — 아무 바이트나 넣으면 훗날 Chromium이
// HEIC를 지원하게 돼도 이 테스트는 계속 통과해버린다.
const fixture = (name: string) => path.join(__dirname, '../fixtures/files', name);

const HEIC = fixture('sample.heic');
const JPG = fixture('sample.jpg');

const FILE_INPUT = '프로필 사진 업로드';
const PREVIEW_ALT = '미리보기';
const UNSUPPORTED_MESSAGE = /지원하지 않는 사진 형식이에요/;

/**
 * 사진 선택 실패 안내.
 *
 * role=alert만으로 좁히지 않는다 — Next dev 오버레이가 빈 alert을 심어두기도 하고,
 * 화면에 다른 알림이 생기면 "안내가 없다"는 단언이 엉뚱한 이유로 깨진다. 문구까지 봐야
 * 이 테스트가 무엇을 지키는지가 분명해진다.
 */
const imageAlert = (page: Page) => page.getByRole('alert').filter({ hasText: UNSUPPORTED_MESSAGE });

test.describe('반려동물 사진 선택 @integration', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // src/proxy.ts(Next 미들웨어)는 access_token 쿠키의 "존재 여부"만 보고 보호 경로를
    // 막는다. 토큰을 검증하지 않으므로 값은 아무거나 좋다.
    await page
      .context()
      .addCookies([
        { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
      ]);

    // 화면 공용 레이어가 보내는 GraphQL이 인증 오류로 떨어지면 errorLink가 /login으로
    // 페이지를 날려버려 정작 검증할 폼에 도달하지 못한다. 빈 성공으로 막아 그 경로를
    // 차단한다 — 이 테스트가 보는 것은 사진 선택뿐이고 화면 데이터는 쓰지 않는다.
    await page.route('**/api/graphql', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{}}' }),
    );

    await page.goto(NEW_PET_PATH);
    await expect(page.getByLabel(FILE_INPUT)).toBeAttached();
  });

  test('올릴 수 있는 사진은 미리보기가 뜬다', async ({ page }) => {
    await page.getByLabel(FILE_INPUT).setInputFiles(JPG);

    await expect(page.getByAltText(PREVIEW_ALT)).toBeVisible();
    await expect(imageAlert(page)).toHaveCount(0);
  });

  test('브라우저가 디코드할 수 없는 형식은 고른 즉시 안내한다', async ({ page }) => {
    await page.getByLabel(FILE_INPUT).setInputFiles(HEIC);

    // 제출까지 기다리지 않는다. 이름·품종·생일을 다 채우고 나서 거부당하면 사용자가
    // 되돌아와 사진을 다시 골라야 한다.
    await expect(imageAlert(page)).toBeVisible();

    // 깨진 이미지를 보여주느니 사진 없음 상태로 둔다.
    await expect(page.getByAltText(PREVIEW_ALT)).toHaveCount(0);
  });

  test('차단된 뒤 올릴 수 있는 사진을 고르면 안내가 사라진다', async ({ page }) => {
    await page.getByLabel(FILE_INPUT).setInputFiles(HEIC);
    await expect(imageAlert(page)).toBeVisible();

    await page.getByLabel(FILE_INPUT).setInputFiles(JPG);

    await expect(imageAlert(page)).toHaveCount(0);
    await expect(page.getByAltText(PREVIEW_ALT)).toBeVisible();
  });

  test('사진은 선택 항목이라 고르지 않아도 등록을 막지 않는다', async ({ page }) => {
    await expect(imageAlert(page)).toHaveCount(0);
    await expect(page.getByAltText(PREVIEW_ALT)).toHaveCount(0);

    await page.getByLabel('이름', { exact: false }).fill('초코');
    await expect(page.getByRole('button', { name: '등록하기' })).toBeEnabled();
  });
});

// TODO(다음 단계): 등록 흐름 자체 — MSW handler override 유틸(e2e/helpers/graphql.ts)이
// 필요하다.
//
// 커버 예정 시나리오:
// - happy path: 폼 입력(이름/종/생일/성별 등) → 등록 완료 → 홈에서 카드 노출
// - error state: 등록 API 실패 시 에러 메시지 노출, 입력값 보존
test.describe('반려동물 등록 @integration', () => {
  test.skip('TODO: happy path - 폼 입력 후 등록 완료 시 홈에서 카드 노출', async () => {});
  test.skip('TODO: error state - 등록 API 실패 시 에러 메시지 노출', async () => {});
});
