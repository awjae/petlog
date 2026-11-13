export interface WeeklySummaryEmailParams {
  petName: string;
  /** 푸시 본문과 같은 요약 한 줄 (예: "기록 3건 · 체중 4.2→4.05kg(-0.15) · 구토 1회."). */
  summary: string;
  petUrl: string;
  settingsUrl: string;
}

export function weeklySummaryEmailSubject(petName: string): string {
  return `[Petlog] ${petName}의 지난주 건강 요약`;
}

// 앱을 설치하지 않아 푸시를 받을 수 없는 사용자에게 보내는 주간 요약 메일.
// 본인이 남긴 기록의 요약이라 광고성 정보가 아니지만, 받기 싫은 사람이 끌 수 있도록 설정
// 링크를 둔다. 인라인 스타일만 쓰는 이유는 reset-password 템플릿과 같다.
export function buildWeeklySummaryEmailHtml({
  petName,
  summary,
  petUrl,
  settingsUrl,
}: WeeklySummaryEmailParams): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
  <h1 style="font-size: 20px; margin-bottom: 16px;">${escape(petName)}의 지난주 건강 요약</h1>
  <p style="font-size: 15px; line-height: 1.6; color: #374151;">${escape(summary)}</p>
  <a href="${petUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
    변화 그래프 보기
  </a>
  <p style="font-size: 12px; line-height: 1.6; color: #9ca3af;">
    지난주에 남긴 기록이 있을 때만 월요일 아침에 보내드려요.
    받지 않으려면 <a href="${settingsUrl}" style="color: #6b7280;">설정 &gt; 주간 건강 알림</a>을 꺼주세요.
  </p>
</div>`.trim();
}
