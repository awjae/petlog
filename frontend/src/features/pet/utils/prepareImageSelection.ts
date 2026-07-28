// 사용자가 사진을 "고른 시점"에 이 브라우저로 다룰 수 있는 파일인지 판단한다.
//
// 판단을 업로드 시점까지 미루면, 올릴 수 없는 사진을 고른 사용자가 미리보기가 깨진 채로
// 이름·품종·생일을 다 입력하고 제출 버튼을 누른 뒤에야 거부당한다. 고르는 순간 알 수 있는
// 정보라 그때 알린다.

import { SERVER_ALLOWED_TYPES } from '../types/upload';

/** 형식 때문에 올릴 수 없을 때의 안내. 선택 시점과 업로드 시점이 같은 말을 해야 한다. */
export const UNSUPPORTED_FORMAT_MESSAGE =
  '지원하지 않는 사진 형식이에요. JPG나 PNG로 저장해서 올려주세요';

export type ImageSelection = { ok: true; previewUrl: string } | { ok: false; message: string };

/**
 * 브라우저가 이 파일을 다룰 수 있는지.
 *
 * 디코드할 수 있으면 compressImage가 jpeg로 변환하므로 서버가 받지 않는 형식이어도
 * 올릴 수 있다. 아이폰 사진(HEIC)이 여기서 갈린다 — Safari는 디코드하므로 통과하고,
 * Chromium은 HEVC 라이선스 문제로 디코더가 없어 실패한다.
 */
async function canUse(file: File): Promise<boolean> {
  // 서버가 그대로 받는 형식이면 변환이 필요 없다. 손상된 파일이라 디코드에 실패하더라도
  // 여기서 막지 않는다 — "지원하지 않는 형식"은 사실과 다른 안내가 되고, 실제 판정은
  // 매직바이트를 보는 서버가 한다.
  //
  // type이 빈 문자열인 경우(일부 브라우저/파일 시스템)도 같은 이유로 서버에 맡긴다.
  if (!file.type || SERVER_ALLOWED_TYPES.includes(file.type)) return true;

  if (typeof createImageBitmap !== 'function') return false;

  try {
    const bitmap = await createImageBitmap(file);
    bitmap.close();
    return true;
  } catch {
    return false;
  }
}

export async function prepareImageSelection(file: File): Promise<ImageSelection> {
  if (!(await canUse(file))) return { ok: false, message: UNSUPPORTED_FORMAT_MESSAGE };
  return { ok: true, previewUrl: URL.createObjectURL(file) };
}
