import { ObjectType, Field, ID, Float, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsNumber, IsDate, IsUUID } from 'class-validator';
import { HealthRecordType } from '@prisma/client';

export const HEALTH_RECORD_VALUE_KIND: Record<HealthRecordType, 'numeric' | 'text'> = {
  [HealthRecordType.weight]: 'numeric',
  [HealthRecordType.appetite]: 'text',
  [HealthRecordType.activity]: 'text',
  [HealthRecordType.symptom]: 'text',
  [HealthRecordType.stool]: 'text',
  [HealthRecordType.vomit]: 'text',
  [HealthRecordType.mood]: 'text',
};

@ObjectType()
export class HealthRecord {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  petId!: string;

  @Field(() => HealthRecordType)
  type!: HealthRecordType;

  @Field(() => Float, { nullable: true })
  numValue?: number;

  @Field({ nullable: true })
  textValue?: string;

  @Field({ nullable: true })
  note?: string;

  @Field(() => Date)
  recordedAt!: Date;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@InputType()
export class CreateHealthRecordInput {
  @Field(() => ID)
  @IsUUID()
  petId!: string;

  @Field(() => HealthRecordType)
  @IsEnum(HealthRecordType)
  type!: HealthRecordType;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  numValue?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  textValue?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  note?: string;

  @Field(() => Date)
  @IsDate()
  recordedAt!: Date;
}

@InputType()
export class UpdateHealthRecordInput {
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  numValue?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  textValue?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  note?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  recordedAt?: Date;
}
