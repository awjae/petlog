import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { ReportType, ReportStatus, ReportGeneratedBy } from '@prisma/client';

registerEnumType(ReportType, { name: 'ReportType' });
registerEnumType(ReportStatus, { name: 'ReportStatus' });
registerEnumType(ReportGeneratedBy, { name: 'ReportGeneratedBy' });

@ObjectType()
export class ProcessingReportInfo {
  @Field(() => ID)
  id!: string;

  @Field(() => ReportStatus)
  status!: ReportStatus;
}

@ObjectType()
export class ReportStatusResult {
  @Field()
  canGenerateThisMonth!: boolean;

  @Field()
  hasEnoughRecords!: boolean;

  @Field(() => Int)
  recordCount!: number;

  @Field(() => Int)
  recordDays!: number;

  @Field(() => Date, { nullable: true })
  nextAvailableAt?: Date;

  @Field(() => ProcessingReportInfo, { nullable: true })
  processingReport?: ProcessingReportInfo;
}

@ObjectType()
export class Report {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  petId!: string;

  @Field(() => ReportType)
  type!: ReportType;

  @Field(() => ReportStatus)
  status!: ReportStatus;

  @Field({ nullable: true })
  overview?: string;

  @Field(() => [String])
  highlights!: string[];

  @Field(() => [String])
  concerns!: string[];

  @Field(() => [String])
  recommendations!: string[];

  @Field(() => ReportGeneratedBy, { nullable: true })
  generatedBy?: ReportGeneratedBy;

  @Field(() => Date)
  periodStart!: Date;

  @Field(() => Date)
  periodEnd!: Date;

  @Field(() => Date)
  createdAt!: Date;
}

@ObjectType()
export class GenerateReportResult {
  @Field(() => ID)
  reportId!: string;

  @Field(() => ReportStatus)
  status!: ReportStatus;
}

@ObjectType()
export class ReportPollResult {
  @Field(() => ID)
  id!: string;

  @Field(() => ReportStatus)
  status!: ReportStatus;

  @Field({ nullable: true })
  failedReason?: string;
}
