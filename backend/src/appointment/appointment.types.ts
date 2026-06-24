import { ObjectType, Field, ID, InputType, registerEnumType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDate, IsUUID } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

registerEnumType(AppointmentStatus, { name: 'AppointmentStatus' });

@ObjectType()
export class Appointment {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  petId!: string;

  @Field()
  hospitalName!: string;

  @Field(() => Date)
  scheduledAt!: Date;

  @Field({ nullable: true })
  reason?: string;

  @Field(() => AppointmentStatus)
  status!: AppointmentStatus;

  @Field({ nullable: true })
  memo?: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@InputType()
export class CreateAppointmentInput {
  @Field(() => ID)
  @IsUUID()
  petId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  hospitalName!: string;

  @Field(() => Date)
  @IsDate()
  scheduledAt!: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  memo?: string;
}

@InputType()
export class UpdateAppointmentInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  hospitalName?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  scheduledAt?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;

  @Field(() => AppointmentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  memo?: string;
}
