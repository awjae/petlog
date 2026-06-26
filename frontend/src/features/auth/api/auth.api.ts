import type { LoginPayload, RegisterPayload } from '../types/auth.types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

async function postJson(path: string, body: unknown): Promise<void> {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new ApiError(data.message ?? '요청에 실패했어요', res.status);
  }
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
  await postJson('/api/auth/register', payload);
}

export async function loginUser(payload: LoginPayload): Promise<void> {
  await postJson('/api/auth/login', payload);
}
