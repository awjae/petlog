import { ObjectType, Field, ID, InputType, registerEnumType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Pet } from '../pet/pet.types';

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

  @Field({ nullable: true })
  subtitle?: string;

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

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => [Pet])
  pets!: Pet[];

  @Field(() => [String])
  recordDates!: string[];

  @Field(() => [UpcomingSchedule])
  upcomingSchedules!: UpcomingSchedule[];

  @Field(() => [CalendarEvent])
  calendarEvents!: CalendarEvent[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
