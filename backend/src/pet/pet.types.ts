import { ObjectType, Field, ID, Float, Int, InputType, registerEnumType } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { Species, Gender, HealthRecordType } from '@prisma/client';

registerEnumType(Species, { name: 'Species' });
registerEnumType(Gender, { name: 'Gender' });
registerEnumType(HealthRecordType, { name: 'HealthRecordType' });

@ObjectType()
export class RecentWeight {
  @Field(() => Float)
  value!: number;

  @Field(() => Date)
  recordedAt!: Date;
}

@ObjectType()
export class HealthRecordSummary {
  @Field(() => ID)
  id!: string;

  @Field(() => HealthRecordType)
  type!: HealthRecordType;

  @Field(() => Date)
  recordedAt!: Date;

  /**
   * 표기(단위·등급 라벨)는 프론트의 buildSummary 한 곳에서만 조립한다.
   * 완성된 문구를 여기서 만들면 같은 규칙이 FE/BE 두 곳에 생겨 조용히 어긋난다.
   */
  @Field(() => Float, { nullable: true })
  numValue?: number;

  @Field({ nullable: true })
  textValue?: string;
}

@ObjectType()
export class Pet {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => Species)
  species!: Species;

  @Field({ nullable: true })
  breed?: string;

  @Field(() => Date, { nullable: true })
  birthDate?: Date;

  @Field(() => Gender)
  gender!: Gender;

  @Field(() => Float, { nullable: true })
  weight?: number;

  @Field()
  isNeutered!: boolean;

  @Field({ nullable: true })
  profileImageUrl?: string;

  @Field(() => RecentWeight, { nullable: true })
  recentWeight?: RecentWeight;

  @Field(() => Int)
  todayRecordCount?: number;

  @Field(() => Int)
  totalHealthRecordCount?: number;

  @Field(() => [HealthRecordSummary])
  recentHealthRecords?: HealthRecordSummary[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@InputType()
export class CreatePetInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => Species)
  @IsEnum(Species)
  species!: Species;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  breed?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  birthDate?: Date;

  @Field(() => Gender)
  @IsEnum(Gender)
  gender!: Gender;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isNeutered?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;
}

@InputType()
export class UpdatePetInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Field(() => Species, { nullable: true })
  @IsOptional()
  @IsEnum(Species)
  species?: Species;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  breed?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  birthDate?: Date;

  @Field(() => Gender, { nullable: true })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isNeutered?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;
}
