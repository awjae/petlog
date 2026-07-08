// 온보딩 슬라이드 데이터 타입 및 상수.
//
// 이미지 경로는 컴포넌트에 하드코딩하지 않고 이 배열에서만 관리한다.
// 지금은 실제 일러스트 에셋이 없는 상태라 public/onboarding/slide-*.png 파일이
// 존재하지 않는다 — SlideIllustration이 이 상태를 Error 플레이스홀더로 자연스럽게
// 처리하며, 추후 정식 에셋이 준비되면 이 배열의 imageSrc 값만 교체하면 된다.
export interface OnboardingSlideData {
  id: string;
  imageSrc: string;
  title: string;
  subtitle: string;
}

export const ONBOARDING_SLIDES: readonly OnboardingSlideData[] = [
  {
    id: 'record',
    imageSrc: '/onboarding/slide-1.png',
    title: '몇 번의 탭으로,\n흩어진 건강 기록을 한 곳에',
    subtitle: '체중, 식사, 투약까지 흩어진 기록을 반려동물별로 모아보세요',
  },
  {
    id: 'timeline',
    imageSrc: '/onboarding/slide-2.png',
    title: '작은 변화도\n타임라인으로 한눈에',
    subtitle: '기록이 쌓일수록 건강 흐름이 선명하게 보여요',
  },
  {
    id: 'ai-report',
    imageSrc: '/onboarding/slide-3.png',
    title: '쌓인 기록을\n이해하기 쉬운 리포트로',
    subtitle: '흩어진 기록을 정리해서 이해하기 쉬운 형태로 보여드려요',
  },
  {
    id: 'calendar',
    imageSrc: '/onboarding/slide-4.png',
    title: '예방접종, 투약 일정도\n캘린더에서 놓치지 않게',
    subtitle: '이제 우리 아이 정보를 등록해볼까요?',
  },
] as const;
