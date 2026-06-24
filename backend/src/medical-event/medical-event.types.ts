import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsDate, IsArray, IsUUID } from 'class-validator';

@ObjectType()
export class MedicalEvent {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  petId!: string;

  @Field()
  hospitalName!: string;

  @Field(() => Date)
  visitDate!: Date;

  @Field()
  description!: string;

  @Field(() => [String])
  attachmentUrls!: string[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@InputType()
export class CreateMedicalEventInput {
  @Field(() => ID)
  @IsUUID()
  petId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  hospitalName!: string;

  @Field(() => Date)
  @IsDate()
  visitDate!: Date;

  @Field()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}

@InputType()
export class UpdateMedicalEventInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  hospitalName?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  visitDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}
