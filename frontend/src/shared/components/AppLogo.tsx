import Image from 'next/image';

interface AppLogoProps {
  /** 렌더 크기(px). 정사각형 에셋이라 가로세로 동일하다. */
  size?: number;
  /** 첫 화면에 바로 보이는 로고면 true (LCP 대상). */
  priority?: boolean;
}

/**
 * 앱 로고.
 *
 * 로고 에셋은 짙은 갈색 단색 실루엣이라 다크 모드에서 배경에 묻힌다. globals.css가
 * `img[data-logo]`를 잡아 실루엣을 밝게 반전시키는데, 이 속성을 마크업에 직접 붙이면
 * 새 화면에서 빠뜨리기 쉽고 빠뜨려도 라이트에서는 멀쩡해 보인다 — 다크에서만
 * 조용히 묻힌다.
 *
 * 그래서 로고는 항상 이 컴포넌트로 렌더한다. next/image를 직접 쓰지 않는다.
 * (결정 문서: .claude/docs/decisions/030-design-token-roles-and-theme-mode.md)
 */
export function AppLogo({ size = 56, priority = false }: AppLogoProps) {
  return (
    <Image src="/main-logo.png" alt="" data-logo width={size} height={size} priority={priority} />
  );
}
