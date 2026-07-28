// 업로드 API의 서버 측 제약. 전송하는 쪽(api/pet.upload.ts)과 전송할 파일을 만드는
// 쪽(utils/compressImage.ts)이 같은 값을 봐야 해서 여기로 모았다.

/**
 * backend/src/upload/upload.controller.ts의 IMAGE_TYPES와 같아야 한다. 서버는 선언된
 * mimetype이 아니라 매직바이트로 판별한 타입을 이 목록과 대조하므로, 여기서 통과시켜도
 * 실제 내용이 다르면 서버가 다시 막는다.
 */
export const SERVER_ALLOWED_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

/** backend/src/upload/upload.controller.ts의 MAX_SIZE_BYTES와 같아야 한다. */
export const SERVER_MAX_SIZE_BYTES = 5 * 1024 * 1024;
