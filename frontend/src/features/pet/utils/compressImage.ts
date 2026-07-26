// 업로드 전에 브라우저에서 사진을 줄인다.
//
// 백엔드 업로드 한도는 5MB이고(backend/src/upload/upload.controller.ts의
// MAX_SIZE_BYTES) 요즘 폰 카메라 원본은 이 한도를 넘기 쉽다. 한도를 넘으면
// 반려동물 등록 자체가 실패하는데, 그 지점이 첫 사용자가 반드시 통과해야 하는
// 관문이라 실패 비용이 가장 크다.
//
// 아바타는 최대 96px(CSS)로 표시되므로 원본 해상도가 필요 없다. 여유를 크게
// 두고 긴 변 1024px로 맞춘다.

const MAX_EDGE = 1024;
const QUALITY = 0.85;
const OUTPUT_TYPE = 'image/webp';

/** 긴 변이 maxEdge를 넘을 때만 비율을 유지해 축소한다. 확대하지 않는다. */
export function calcTargetSize(
  width: number,
  height: number,
  maxEdge: number = MAX_EDGE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };

  const ratio = maxEdge / longest;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, OUTPUT_TYPE, QUALITY));
}

function replaceExtension(name: string, ext: string): string {
  return `${name.replace(/\.[^.]+$/, '')}.${ext}`;
}

/**
 * 실패하면 원본 File을 그대로 돌려준다. 압축은 업로드를 돕는 최적화일 뿐이고,
 * 여기서 예외를 던지면 "사진만 줄이면 됐을 일"이 등록 실패가 된다.
 */
export async function compressImage(file: File): Promise<File> {
  // GIF는 건드리지 않는다. canvas로 다시 그리면 첫 프레임만 남아 애니메이션이 사라진다.
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  if (typeof createImageBitmap !== 'function') return file;

  let bitmap: ImageBitmap | undefined;
  try {
    // imageOrientation: 폰 사진의 EXIF 회전 정보를 적용해서 디코드한다. 이걸 빼면
    // 세로로 찍은 사진이 canvas를 거치며 눕는다(EXIF가 화소에 반영되지 않으므로).
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

    const { width, height } = calcTargetSize(bitmap.width, bitmap.height);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await toBlob(canvas);
    // toBlob은 지원하지 않는 타입을 요청받으면 조용히 image/png로 떨어진다.
    // png는 사진에서 원본보다 커질 수 있으므로 그 경우는 원본을 쓴다.
    if (!blob || blob.type !== OUTPUT_TYPE) return file;

    // 이미 충분히 작은 사진을 굳이 재인코딩해서 키우지 않는다.
    if (blob.size >= file.size) return file;

    return new File([blob], replaceExtension(file.name, 'webp'), {
      type: OUTPUT_TYPE,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}
