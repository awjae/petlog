// 랜딩의 제품 미리보기 이미지(public/landing/*.jpg)를 실제 화면에서 다시 찍는다.
// 화면 디자인이 바뀌면 랜딩 이미지가 실제 앱과 달라지므로, 손으로 편집하지 않고 이 스크립트로 갱신한다.
//
// 실행: 목업 모드 dev 서버를 띄운 뒤
//   NEXT_PUBLIC_USE_MOCK=true npx next dev -p 3123
//   BASE_URL=http://localhost:3123 node scripts/capture-landing-screenshots.mjs
//
// 데이터는 GraphQL 응답을 직접 심는다(목업 데이터에는 체중 기록이 하나뿐이라 그래프가 비어 있다).
import { chromium, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3123';
const OUT = new URL('../public/landing/', import.meta.url).pathname;
const NOW = new Date('2026-11-13T03:00:00Z');
const dayIso = (daysAgo) => new Date(NOW.getTime() - daysAgo * 86400000).toISOString();

const weights = [[84, 4.6], [70, 4.55], [56, 4.5], [42, 4.42], [28, 4.35], [14, 4.3], [7, 4.28], [0, 4.25]];
const records = [
  ...weights.map(([d, v], i) => ({ __typename: 'HealthRecord', id: `w${i}`, type: 'weight', recordedAt: dayIso(d), numValue: v, textValue: null, note: null })),
  { __typename: 'HealthRecord', id: 'a1', type: 'appetite', recordedAt: dayIso(1), numValue: null, textValue: '잘 먹음', note: null },
  { __typename: 'HealthRecord', id: 'c1', type: 'activity', recordedAt: dayIso(2), numValue: 30, textValue: '1.2', note: null },
];
const pet = {
  __typename: 'Pet', id: 'pet-1', name: '초코', species: 'dog', breed: '말티즈',
  birthDate: '2021-03-15T03:00:00.000Z', gender: 'male', weight: 4.25, isNeutered: true, profileImageUrl: null,
  recentWeight: { value: 4.25, recordedAt: dayIso(0) }, todayRecordCount: 1, totalHealthRecordCount: records.length,
  recentHealthRecords: records.slice(-5).reverse().map(({ note, ...r }) => r), createdAt: dayIso(120), updatedAt: dayIso(0),
};
const home = {
  me: { __typename: 'User', id: 'u', recordDates: Array.from({ length: 7 }, (_, i) => dayIso(i)), upcomingSchedules: [], pets: [pet] },
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  ...devices['iPhone 13'], deviceScaleFactor: 2, colorScheme: 'light', serviceWorkers: 'block', timezoneId: 'Asia/Seoul',
});
await ctx.addCookies([{ name: 'access_token', value: 'x', url: BASE_URL, httpOnly: true }]);
await ctx.addInitScript(() => localStorage.setItem('petlog:onboarding-completed', 'true'));
const page = await ctx.newPage();
await page.clock.setFixedTime(NOW);
await page.route('**/api/graphql', async (route) => {
  const { operationName } = route.request().postDataJSON();
  const data =
    operationName === 'PetDetail' ? { pet }
    : operationName === 'HealthRecords' ? { healthRecords: records }
    : operationName === 'HomeQuery' ? home
    : {};
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) });
});

// top 요소의 위쪽부터 bottom 요소의 아래쪽까지 잘라낸다.
async function capture(path, top, bottom, file, margin) {
  await page.goto(BASE_URL + path);
  await page.waitForTimeout(2000);
  // 개발 모드 표시(N 배지)가 찍히지 않게 지운다.
  await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach((e) => e.remove()));
  const a = await top().boundingBox();
  const b = await bottom().boundingBox();
  await page.screenshot({
    path: OUT + file, type: 'jpeg', quality: 82,
    clip: { x: 0, y: a.y - margin.top, width: 390, height: b.y + b.height - a.y + margin.top + margin.bottom },
  });
}

await capture(
  '/pets/pet-1',
  () => page.getByText('체중 변화', { exact: true }),
  () => page.getByText(/11\.13 · 4\.25 kg/),
  'weight-trend.jpg',
  { top: 18, bottom: 22 },
);
await capture(
  '/home',
  () => page.getByText(/연속 기록 중/),
  () => page.getByRole('link', { name: /메모/ }).first(),
  'home-record.jpg',
  { top: 30, bottom: 24 },
);
await browser.close();
console.log('saved to', OUT);
