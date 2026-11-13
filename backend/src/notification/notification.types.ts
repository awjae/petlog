import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

@ObjectType()
export class NotificationPreference {
  @Field()
  vaccinationDueEnabled!: boolean;

  @Field()
  appointmentReminderEnabled!: boolean;

  @Field()
  weeklyCheckinEnabled!: boolean;

  @Field()
  medicationReminderEnabled!: boolean;
}

// 필드마다 class-validator 데코레이터가 있어야 한다. 전역 ValidationPipe가 whitelist: true라
// 데코레이터 없는 필드는 요청에서 조용히 지워진다. 예전에는 하나도 없어서 input이 항상 {}로
// 들어왔고, 설정 화면의 알림 스위치를 꺼도 아무것도 저장되지 않았다(input-validation.spec.ts).
@InputType()
export class UpdateNotificationPreferenceInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  vaccinationDueEnabled?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  appointmentReminderEnabled?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  weeklyCheckinEnabled?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  medicationReminderEnabled?: boolean;
}
