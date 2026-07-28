'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { prepareImageSelection } from '../utils/prepareImageSelection';

/**
 * 프로필 사진 선택 상태. 등록 화면과 수정 화면이 같은 규칙을 쓴다.
 *
 * 미리보기 URL의 수명도 여기서 관리한다. createObjectURL은 명시적으로 해제하지 않으면
 * 문서가 살아 있는 동안 파일 전체를 메모리에 붙들어 둔다 — 사진을 여러 번 바꿔 고르면
 * 그만큼 쌓인다.
 */
export function useImageSelection() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');

  // 우리가 만든 objectURL만 해제 대상이다. 수정 화면이 보여주는 기존 사진은 원격
  // URL이라 해제하면 안 된다.
  const objectUrl = useRef<string | null>(null);

  const releaseObjectUrl = useCallback(() => {
    if (!objectUrl.current) return;
    URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
  }, []);

  useEffect(() => releaseObjectUrl, [releaseObjectUrl]);

  const selectFile = useCallback(
    async (file: File) => {
      const result = await prepareImageSelection(file);

      if (!result.ok) {
        // 고른 파일을 반영하지 않는다. 직전에 고른 멀쩡한 사진이 있었다면 그대로 둔다.
        setImageError(result.message);
        return;
      }

      releaseObjectUrl();
      objectUrl.current = result.previewUrl;
      setImageError('');
      setImageFile(file);
      setPreviewUrl(result.previewUrl);
    },
    [releaseObjectUrl],
  );

  /** 서버에 저장돼 있던 사진을 초기 미리보기로 보여준다 (수정 화면). */
  const showStoredImage = useCallback(
    (url: string | null) => {
      releaseObjectUrl();
      setPreviewUrl(url);
    },
    [releaseObjectUrl],
  );

  /**
   * 미리보기 렌더링이 실패했을 때. 깨진 이미지 아이콘을 보여주느니 사진 없음 상태로
   * 되돌린다. 선택 시점 검사를 통과하고도 여기 오는 경우(손상된 파일, 기존 사진의
   * 네트워크 실패)라 원인을 특정할 수 없으므로 문구는 붙이지 않는다.
   */
  const handlePreviewError = useCallback(() => {
    releaseObjectUrl();
    setPreviewUrl(null);
  }, [releaseObjectUrl]);

  return {
    imageFile,
    previewUrl,
    imageError,
    selectFile,
    showStoredImage,
    handlePreviewError,
  };
}
