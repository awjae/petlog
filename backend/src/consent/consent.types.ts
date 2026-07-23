import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ConsentStatus {
  @Field()
  marketingNotificationAgreed!: boolean;
}
