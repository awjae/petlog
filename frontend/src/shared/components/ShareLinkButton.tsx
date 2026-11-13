'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';

interface ShareLinkButtonProps {
  title: string;
  url: string;
  className?: string;
}

/**
 * 공개 콘텐츠(가이드 등) 링크 공유. 모바일에서는 OS 공유 시트를 띄워 카카오톡·메시지로
 * 바로 보낼 수 있고(카카오 SDK 키 없이), 공유 시트가 없는 환경(데스크톱 일부)에서는 링크를
 * 복사한다. 리포트 공유(ShareReportSheet)와 같은 판정 방식이다.
 */
export function ShareLinkButton({ title, url, className }: ShareLinkButtonProps) {
  const [message, setMessage] = useState('');

  async function handleShare() {
    setMessage('');
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        // 사용자가 공유 시트를 닫은 것은 실패가 아니다.
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage('링크를 복사했어요');
    } catch {
      setMessage('복사하지 못했어요. 주소창의 링크를 직접 복사해주세요');
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={handleShare}>
        <Share2 size={16} strokeWidth={2} aria-hidden="true" />이 글 공유하기
      </button>
      {message && <p role="status">{message}</p>}
    </>
  );
}
