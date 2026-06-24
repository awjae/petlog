import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsDate, IsUUID } from 'class-validator';

@ObjectType()
export class Vaccination {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  petId!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  code?: string;

  @Field(() => Date)
  vaccinatedAt!: Date;

  @Field(() => Date, { nullable: true })
  nextDueAt?: Date;

  @Field({ nullable: true })
  memo?: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@InputType()
export class CreateVaccinationInput {
  @Field(() => ID)
  @IsUUID()
  petId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  code?: string;

  @Field(() => Date)
  @IsDate()
  vaccinatedAt!: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  nextDueAt?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  memo?: string;
}

@InputType()
export class UpdateVaccinationInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  code?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  vaccinatedAt?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  nextDueAt?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  memo?: string;
}
