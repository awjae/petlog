// filepath: src/app/register/page.tsx
//
// 회원가입 화면은 상태/이벤트 처리가 많아 클라이언트 컴포넌트(RegisterPageClient)로 구현하되,
// metadata export는 서버 컴포넌트에서만 가능하므로 이 파일은 얇은 서버 래퍼 역할만 한다.
import type { Metadata } from 'next';
import { RegisterPageClient } from './RegisterPageClient';

export const metadata: Metadata = {
  title: '회원가입',
  description: 'Petlog에 가입하고 반려동물의 건강 기록을 관리해보세요.',
};

export default function RegisterPage() {
  return <RegisterPageClient />;
}
