import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsDate, IsUUID } from 'class-validator';

@ObjectType()
export class Medication {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  petId!: string;

  @Field()
  name!: string;

  @Field()
  dosage!: string;

  @Field()
  frequency!: string;

  @Field(() => Date)
  startDate!: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@InputType()
export class CreateMedicationInput {
  @Field(() => ID)
  @IsUUID()
  petId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  dosage!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  frequency!: string;

  @Field(() => Date)
  @IsDate()
  startDate!: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  endDate?: Date;
}

@InputType()
export class UpdateMedicationInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  dosage?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  frequency?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  endDate?: Date;
}
