import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class NotificationPreference {
  @Field()
  vaccinationDueEnabled!: boolean;

  @Field()
  appointmentReminderEnabled!: boolean;

  @Field()
  weeklyCheckinEnabled!: boolean;
}

@InputType()
export class UpdateNotificationPreferenceInput {
  @Field({ nullable: true })
  vaccinationDueEnabled?: boolean;

  @Field({ nullable: true })
  appointmentReminderEnabled?: boolean;

  @Field({ nullable: true })
  weeklyCheckinEnabled?: boolean;
}
