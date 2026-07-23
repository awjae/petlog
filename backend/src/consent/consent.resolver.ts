import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ConsentService } from './consent.service';
import { ConsentStatus } from './consent.types';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@Resolver()
@UseGuards(GqlAuthGuard)
export class ConsentResolver {
  constructor(private readonly consentService: ConsentService) {}

  @Query(() => ConsentStatus)
  async consentStatus(@CurrentUser() user: AuthUser): Promise<ConsentStatus> {
    const marketingNotificationAgreed = await this.consentService.getMarketingConsentStatus(
      user.id,
    );
    return { marketingNotificationAgreed };
  }

  @Mutation(() => ConsentStatus)
  async updateMarketingConsent(
    @CurrentUser() user: AuthUser,
    @Args('agreed') agreed: boolean,
    @Context() ctx: { req: Request },
  ): Promise<ConsentStatus> {
    const marketingNotificationAgreed = await this.consentService.updateMarketingConsent(
      user.id,
      agreed,
      { ipAddress: ctx.req.ip, userAgent: ctx.req.get('user-agent') },
    );
    return { marketingNotificationAgreed };
  }
}
