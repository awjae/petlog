import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ReportShareService } from './report-share.service';
import { ReportShareSettings } from './report-share.types';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

// 소유자 전용 — 인증 필요. 공개 조회는 ReportSharePublicController(REST)에서 별도로 처리한다.
@Resolver(() => ReportShareSettings)
@UseGuards(GqlAuthGuard)
export class ReportShareResolver {
  constructor(private readonly reportShareService: ReportShareService) {}

  @Query(() => ReportShareSettings)
  reportShareSettings(
    @CurrentUser() user: AuthUser,
    @Args('reportId', { type: () => ID }) reportId: string,
  ) {
    return this.reportShareService.getShareSettings(user.id, reportId);
  }

  @Mutation(() => ReportShareSettings)
  startReportShare(
    @CurrentUser() user: AuthUser,
    @Args('reportId', { type: () => ID }) reportId: string,
  ) {
    return this.reportShareService.startShare(user.id, reportId);
  }

  @Mutation(() => ReportShareSettings)
  stopReportShare(
    @CurrentUser() user: AuthUser,
    @Args('reportId', { type: () => ID }) reportId: string,
  ) {
    return this.reportShareService.stopShare(user.id, reportId);
  }

  @Mutation(() => ReportShareSettings)
  setReportShareIncludeConcerns(
    @CurrentUser() user: AuthUser,
    @Args('reportId', { type: () => ID }) reportId: string,
    @Args('includeConcerns') includeConcerns: boolean,
  ) {
    return this.reportShareService.setIncludeConcerns(user.id, reportId, includeConcerns);
  }
}
