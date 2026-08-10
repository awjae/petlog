import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Pet } from '../pet/pet.types';
import { CalendarEvent, UpcomingSchedule } from '../calendar/calendar.types';

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
