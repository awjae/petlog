export class UploadError extends Error {}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/api/upload/image', {
    method: 'POST',
    credentials: 'include',
    body: form,
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new UploadError(data.message ?? '이미지 업로드에 실패했어요');
  }

  const { url } = (await res.json()) as { url: string };
  return url;
}
