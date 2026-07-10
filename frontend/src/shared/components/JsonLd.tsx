// filepath: src/shared/components/JsonLd.tsx

interface JsonLdProps {
  data: Record<string, unknown>;
}

// schema.org 구조화 데이터를 <script type="application/ld+json">로 렌더링하는
// 범용 컴포넌트. 데이터 정의는 호출하는 페이지가 책임지고, 이 컴포넌트는
// 직렬화 + 렌더링 책임만 가진다.
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
