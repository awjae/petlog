'use client';

export default function SentryTestPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Sentry 연동 테스트 (확인 후 삭제 예정)</h1>
      <button
        onClick={() => {
          // @ts-expect-error 의도적으로 존재하지 않는 함수를 호출한다
          myUndefinedFunction();
        }}
      >
        클라이언트 에러 발생시키기
      </button>
    </div>
  );
}
