import type {
  LoginPayload,
  RegisterPayload,
  ForgotPasswordResponse,
  VerifyResetTokenResponse,
  ResetPasswordResponse,
} from '../types/auth.types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

function extractMessage(data: unknown): string | undefined {
  const raw = (data as { message?: string | string[] } | null)?.message;
  if (Array.isArray(raw)) return raw.join(', ');
  return raw;
}

async function postJson<T = void>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(extractMessage(data) ?? '요청에 실패했어요', res.status);
  }

  return data as T;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(extractMessage(data) ?? '요청에 실패했어요', res.status);
  }

  return data as T;
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
  await postJson('/api/auth/register', payload);
}

export async function loginUser(payload: LoginPayload): Promise<void> {
  await postJson('/api/auth/login', payload);
}

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
  return postJson<ForgotPasswordResponse>('/api/auth/forgot-password', { email });
}

export async function verifyResetToken(token: string): Promise<VerifyResetTokenResponse> {
  return getJson<VerifyResetTokenResponse>(
    `/api/auth/reset-password/verify?token=${encodeURIComponent(token)}`,
  );
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ResetPasswordResponse> {
  return postJson<ResetPasswordResponse>('/api/auth/reset-password', { token, newPassword });
}
