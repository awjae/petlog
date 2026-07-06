export interface ResetPasswordEmailParams {
  resetUrl: string;
}

export const RESET_PASSWORD_EMAIL_SUBJECT = '[Petlog] 비밀번호 재설정 안내';

// 비밀번호 재설정 안내 메일 HTML 템플릿.
// 다양한 이메일 클라이언트 호환성을 위해 외부 스타일시트 없이 인라인 스타일만 사용한다.
export function buildResetPasswordEmailHtml({ resetUrl }: ResetPasswordEmailParams): string {
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
  <h1 style="font-size: 20px; margin-bottom: 16px;">비밀번호 재설정</h1>
  <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
    Petlog 계정의 비밀번호 재설정을 요청하셨습니다. 아래 버튼을 눌러 새 비밀번호를 설정해주세요.
  </p>
  <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
    비밀번호 재설정하기
  </a>
  <p style="font-size: 12px; line-height: 1.6; color: #9ca3af;">
    이 링크는 30분 동안만 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시해주세요.
  </p>
  <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">
    버튼이 동작하지 않는다면 다음 링크를 복사해 브라우저 주소창에 붙여넣어주세요: ${resetUrl}
  </p>
</div>`.trim();
}
