import { compressImage } from '../utils/compressImage';
import { UNSUPPORTED_FORMAT_MESSAGE } from '../utils/prepareImageSelection';
import { SERVER_ALLOWED_TYPES, SERVER_MAX_SIZE_BYTES } from '../types/upload';

// 백엔드 한도(5MB)를 넘으면 multer가 요청을 끊는데, 그 응답에는 아래에서 읽는
// message가 없어 사용자에게는 "이미지 업로드에 실패했어요"만 남는다. 원인도 대안도
// 알 수 없는 실패라, 애초에 한도를 넘기지 않도록 보내기 전에 줄인다.

export class UploadError extends Error {}

export async function uploadImage(file: File): Promise<string> {
  const compressed = await compressImage(file);

  // 선택 시점(prepareImageSelection)에 이미 걸러지지만, 업로드 경로가 그 검사에
  // 의존하지 않도록 여기서도 확인한다.
  //
  // 형식 검사가 크기 검사보다 먼저다. 아이폰 사진(HEIC)은 디코드할 수 없는 브라우저
  // (Chrome 등)에서 원본이 그대로 돌아오는데, 서버가 HEIC를 허용하지 않으므로 용량과
  // 무관하게 반드시 거부된다. 이때 크기부터 보면 "5MB 이하로 줄여서 올려주세요"라는,
  // 따라 해도 소용없는 안내를 하게 된다.
  //
  // type이 빈 문자열인 경우(일부 브라우저/파일 시스템)는 판단하지 않고 서버에 맡긴다.
  if (compressed.type && !SERVER_ALLOWED_TYPES.includes(compressed.type)) {
    throw new UploadError(UNSUPPORTED_FORMAT_MESSAGE);
  }

  // 압축이 불가능한 형식(GIF)이거나 브라우저가 canvas 경로를 지원하지 않아 원본이
  // 그대로 돌아온 경우, 한도를 넘는지 여기서 확인해 사용자가 이해할 수 있는 말로
  // 알린다. 서버까지 갔다가 정체불명의 실패로 돌아오는 것보다 낫다.
  if (compressed.size > SERVER_MAX_SIZE_BYTES) {
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
