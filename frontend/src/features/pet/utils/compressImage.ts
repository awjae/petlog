// 업로드 전에 브라우저에서 사진을 줄인다.
//
// 백엔드 업로드 한도는 5MB이고(backend/src/upload/upload.controller.ts의
// MAX_SIZE_BYTES) 요즘 폰 카메라 원본은 이 한도를 넘기 쉽다. 한도를 넘으면
// 반려동물 등록 자체가 실패하는데, 그 지점이 첫 사용자가 반드시 통과해야 하는
// 관문이라 실패 비용이 가장 크다.
//
// 아바타는 최대 96px(CSS)로 표시되므로 원본 해상도가 필요 없다. 여유를 크게
// 두고 긴 변 1024px로 맞춘다.

import { SERVER_ALLOWED_TYPES } from '../types/upload';

const MAX_EDGE = 1024;
const QUALITY = 0.85;

// 브라우저와 무관하게 항상 jpeg로 내보낸다. 결정 문서: 032-upload-image-format-jpeg.md
//
// webp를 쓰지 않는 이유: Safari는 canvas로 webp를 만들지 못한다("표시"는 Safari 14부터
// 되므로 지원한다고 착각하기 쉬운데 디코딩과 인코딩은 별개다). 게다가 못 만들 때 예외를
// 던지지 않고 조용히 png를 돌려주므로 실패를 알아채기도 어렵다. 실제 사진 기준 webp의
// 이득은 16KB 남짓이고, 저장 포맷은 next/image가 서빙 시점에 다시 인코딩하므로
// 사용자에게 전달되지도 않는다.
const OUTPUT_TYPE = 'image/jpeg';
const OUTPUT_EXTENSION = 'jpg';

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

/** jpeg 인코딩에 성공한 Blob. 실패하면 null. */
async function encode(canvas: HTMLCanvasElement): Promise<Blob | null> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, OUTPUT_TYPE, QUALITY),
  );

  // toBlob은 만들지 못하는 타입을 요청받아도 예외를 던지지 않고 조용히 image/png를
  // 돌려준다. 요청한 타입이 그대로 돌아왔을 때만 성공으로 본다 — jpeg는 사실상 모든
  // 브라우저가 인코딩하므로 여기 걸릴 일은 없어야 하지만, 조용한 실패라 확인해 둔다.
  return blob && blob.type === OUTPUT_TYPE ? blob : null;
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

    // 그린 뒤엔 원본 비트맵이 필요 없다. 여기서 놓지 않으면 아래 toBlob 인코딩 동안
    // 원본 RGBA와 캔버스, 인코딩 버퍼가 동시에 메모리에 물린다(저사양 안드로이드에서
    // 큰 사진일수록 위험하다). finally의 close는 예외 경로용 안전망으로 남긴다.
    bitmap.close();

    const blob = await encode(canvas);
    if (!blob) return file;

    // 이미 충분히 작은 사진을 굳이 재인코딩해서 키우지 않는다.
    //
    // 단 원본이 서버가 받지 않는 형식일 때는 예외다. 아이폰 사진(HEIC)이 그런데,
    // Safari는 HEIC를 디코드할 수 있어 여기까지 오지만 서버는 HEIC를 거부한다.
    // 이때 "더 크다"는 이유로 원본을 돌려주면 크기와 무관하게 업로드가 막히므로,
    // 커지더라도 변환 결과를 쓰는 쪽이 낫다.
    if (blob.size >= file.size && SERVER_ALLOWED_TYPES.includes(file.type)) return file;

    return new File([blob], replaceExtension(file.name, OUTPUT_EXTENSION), {
      type: OUTPUT_TYPE,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}
