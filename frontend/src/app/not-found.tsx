import { StatusPage } from '@/shared/components/StatusPage';

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="페이지를 찾을 수 없어요"
      description="주소가 변경되었거나 삭제된 페이지예요."
      action={{ label: '홈으로', href: '/home' }}
    />
  );
}
