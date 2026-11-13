// Frontend Integration(@integration) — 알림 설정 스위치가 누르는 즉시 바뀌는지.
//
// NotificationPreference에는 id가 없어 mutation 결과가 조회 쿼리 캐시에 자동 반영되지 않았다.
// 서버에 저장돼도 스위치는 새로고침 전까지 그대로라, 사용자는 "안 꺼진다"고 느낀다.
// (서버 쪽 원인 — 입력 필드가 whitelist에 지워지던 것 — 은 backend input-validation.spec.ts)

import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('알림 스위치를 끄면 바로 꺼진 상태로 보이고, 끈 값만 보낸다 @integration', async ({
  page,
  baseURL,
}) => {
  await page
    .context()
    .addCookies([
      { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
    ]);
  const sent: unknown[] = [];
  const pref = {
    vaccinationDueEnabled: true,
    appointmentReminderEnabled: true,
    weeklyCheckinEnabled: true,
    medicationReminderEnabled: true,
  };
  await page.route('**/api/graphql', async (route) => {
    const { operationName, variables } = route.request().postDataJSON() as {
      operationName?: string;
      variables?: { input: Partial<typeof pref> };
    };
    let data: unknown = {};
    // 설정 화면의 다른 쿼리가 비면 화면 전체가 에러 상태가 되어 스위치가 비활성화된다.
    if (operationName === 'SettingsMe')
      data = { me: { __typename: 'User', id: 'u', name: null, email: 'a@petlog.test' } };
    if (operationName === 'ConsentStatus')
      data = { consentStatus: { marketingNotificationAgreed: false } };
    if (operationName === 'NotificationPreference') data = { notificationPreference: pref };
    if (operationName === 'UpdateNotificationPreference') {
      sent.push(variables!.input);
      Object.assign(pref, variables!.input);
      data = { updateNotificationPreference: pref };
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data }),
    });
  });

  await page.goto('/settings');
  const toggle = page.getByRole('switch', { name: '투약 알림' });
  await expect(toggle).toHaveAttribute('aria-checked', 'true');

  await toggle.click();

  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(sent).toEqual([{ medicationReminderEnabled: false }]);
});
