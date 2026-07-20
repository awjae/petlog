import { ObjectType, Field } from '@nestjs/graphql';

// 소유자용 공유 설정 조회/변경 결과. shareToken은 공유한 적이 없으면 null이다
// (isActive=false와 "행 없음"을 구분하지 않는 건 공개 조회 응답에만 적용되는 원칙이고,
// 소유자 본인에게는 현재 상태를 있는 그대로 보여줘야 하므로 여기선 구분한다).
@ObjectType()
export class ReportShareSettings {
  @Field()
  isActive!: boolean;

  @Field()
  includeConcerns!: boolean;

  @Field(() => String, { nullable: true })
  shareToken?: string | null;
}
