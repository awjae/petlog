import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';

export enum CalendarEventType {
  health_record = 'health_record',
  vaccination = 'vaccination',
  medication = 'medication',
  appointment = 'appointment',
  medical_event = 'medical_event',
}

registerEnumType(CalendarEventType, { name: 'CalendarEventType' });

@ObjectType()
export class CalendarEvent {
  @Field(() => ID)
  id!: string;

  @Field()
  date!: string;

  @Field(() => CalendarEventType)
  type!: CalendarEventType;

  @Field()
  title!: string;

  /**
   * 이미 사람이 읽을 수 있는 형태로 굳어진 값(투약 용량, 예약 사유 등)만 담는다.
   * 건강 기록처럼 "값 + 단위"로 조립해야 하는 항목은 여기에 넣지 않고
   * recordType/numValue/textValue 를 그대로 내려보내 표기를 프론트에서 한 곳으로 모은다.
   */
  @Field({ nullable: true })
  subtitle?: string;

  /** health_record 이벤트에서만 채워진다 (weight | appetite | activity | ...) */
  @Field({ nullable: true })
  recordType?: string;

  @Field(() => Float, { nullable: true })
  numValue?: number;

  @Field({ nullable: true })
  textValue?: string;

  @Field(() => ID)
  petId!: string;
}

export enum ScheduleType {
  vaccination = 'vaccination',
  medication = 'medication',
  appointment = 'appointment',
}

registerEnumType(ScheduleType, { name: 'ScheduleType' });

@ObjectType()
export class UpcomingSchedule {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  petId!: string;

  @Field()
  petName!: string;

  @Field({ nullable: true })
  petProfileImageUrl?: string;

  @Field(() => ScheduleType)
  type!: ScheduleType;

  @Field()
  title!: string;

  @Field(() => Date)
  dueDate!: Date;
}
