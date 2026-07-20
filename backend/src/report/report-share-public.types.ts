// 공개(비로그인) 조회 REST 응답 — GraphQL ObjectType이 아닌 순수 인터페이스다.
// concerns는 includeConcerns=false일 때 키 자체를 응답에서 제외한다(빈 배열이 아니라
// "애초에 없음") — 프론트가 "빈 배열이라 안 보여준다"가 아니라 "필드가 없다"로
// 처리할 수 있게 하기 위함. generatedBy(mock 배지), 정확한 시분, 계정 식별 정보는
// 절대 포함하지 않는다.
export interface PublicSharedReport {
  petName: string;
  overview: string | null;
  highlights: string[];
  concerns?: string[];
  recommendations: string[];
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
}
