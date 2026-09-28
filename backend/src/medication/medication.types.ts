import { ObjectType, Field, ID, InputType, registerEnumType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsDate, IsUUID, IsEnum } from 'class-validator';
import { MedicationFrequency } from '@prisma/client';

registerEnumType(MedicationFrequency, { name: 'MedicationFrequency' });

// 푸시 알림 문구용. 화면 표시는 프론트엔드 FREQUENCY_OPTIONS가 같은 문구를 따로 가진다.
export const MEDICATION_FREQUENCY_LABEL: Record<MedicationFrequency, string> = {
  onceDaily: '하루 1회',
  twiceDaily: '하루 2회',
  threeTimesDaily: '하루 3회',
  asNeeded: '필요시',
};

@ObjectType()
export class Medication {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  petId!: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  dosage?: string;

  @Field(() => MedicationFrequency, { nullable: true })
  frequency?: MedicationFrequency;

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

  @Field(() => MedicationFrequency, { nullable: true })
  @IsOptional()
  @IsEnum(MedicationFrequency)
  frequency?: MedicationFrequency;

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

  @Field(() => MedicationFrequency, { nullable: true })
  @IsOptional()
  @IsEnum(MedicationFrequency)
  frequency?: MedicationFrequency;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  endDate?: Date;
}
