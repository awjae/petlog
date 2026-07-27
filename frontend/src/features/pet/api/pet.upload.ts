import { compressImage } from '../utils/compressImage';

// 백엔드 한도(5MB)를 넘으면 multer가 요청을 끊는데, 그 응답에는 아래에서 읽는
// message가 없어 사용자에게는 "이미지 업로드에 실패했어요"만 남는다. 원인도 대안도
// 알 수 없는 실패라, 애초에 한도를 넘기지 않도록 보내기 전에 줄인다.
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// backend/src/upload/upload.controller.ts의 IMAGE_TYPES와 같아야 한다. 서버는 선언된
// mimetype이 아니라 매직바이트로 판별한 타입을 이 목록과 대조하므로, 여기서 통과시켜도
// 실제 내용이 다르면 서버가 다시 막는다.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export class UploadError extends Error {}

export async function uploadImage(file: File): Promise<string> {
  const compressed = await compressImage(file);

  // 형식 검사가 크기 검사보다 먼저다. 아이폰 사진(HEIC)은 압축 경로에서 디코드에
  // 실패해 원본이 그대로 돌아오는데, 서버가 HEIC를 허용하지 않으므로 용량과 무관하게
  // 반드시 거부된다. 이때 크기부터 보면 "5MB 이하로 줄여서 올려주세요"라는, 따라 해도
  // 소용없는 안내를 하게 된다.
  //
  // type이 빈 문자열인 경우(일부 브라우저/파일 시스템)는 판단하지 않고 서버에 맡긴다.
  if (compressed.type && !ALLOWED_TYPES.includes(compressed.type)) {
    throw new UploadError('지원하지 않는 사진 형식이에요. JPG나 PNG로 저장해서 올려주세요');
  }

  // 압축이 불가능한 형식(GIF)이거나 브라우저가 canvas 경로를 지원하지 않아 원본이
  // 그대로 돌아온 경우, 한도를 넘는지 여기서 확인해 사용자가 이해할 수 있는 말로
  // 알린다. 서버까지 갔다가 정체불명의 실패로 돌아오는 것보다 낫다.
  if (compressed.size > MAX_SIZE_BYTES) {
    throw new UploadError('사진 용량이 너무 커요. 5MB 이하로 줄여서 올려주세요');
  }

  const form = new FormData();
  form.append('file', compressed);

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
