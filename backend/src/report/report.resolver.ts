import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { Report, ReportStatusResult, GenerateReportResult, ReportPollResult } from './report.types';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { ReportType } from '@prisma/client';

@Resolver(() => Report)
@UseGuards(GqlAuthGuard)
export class ReportResolver {
  constructor(private readonly reportService: ReportService) {}

  @Query(() => ReportStatusResult)
  reportStatus(@CurrentUser() user: AuthUser, @Args('petId', { type: () => ID }) petId: string) {
    return this.reportService.getReportStatus(user.id, petId);
  }

  @Query(() => [Report])
  reports(@CurrentUser() user: AuthUser, @Args('petId', { type: () => ID }) petId: string) {
    return this.reportService.findAll(user.id, petId);
  }

  @Query(() => Report, { nullable: true })
  report(@CurrentUser() user: AuthUser, @Args('id', { type: () => ID }) id: string) {
    return this.reportService.findOne(user.id, id);
  }

  @Query(() => ReportPollResult)
  reportPollStatus(@CurrentUser() user: AuthUser, @Args('id', { type: () => ID }) id: string) {
    return this.reportService.pollStatus(user.id, id);
  }

  @Mutation(() => GenerateReportResult)
  generateReport(
    @CurrentUser() user: AuthUser,
    @Args('petId', { type: () => ID }) petId: string,
    @Args('type', { type: () => ReportType }) type: ReportType,
  ) {
    return this.reportService.generateReport(user.id, petId, type);
  }
}
