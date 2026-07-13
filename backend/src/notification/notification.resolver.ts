import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationPreference, UpdateNotificationPreferenceInput } from './notification.types';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@Resolver()
@UseGuards(GqlAuthGuard)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @Mutation(() => Boolean)
  registerPushToken(@CurrentUser() user: AuthUser, @Args('token') token: string) {
    return this.notificationService.registerPushToken(user.id, token);
  }

  @Mutation(() => Boolean)
  sendTestPushNotification(@CurrentUser() user: AuthUser) {
    return this.notificationService.sendTestPush(user.id);
  }

  @Query(() => NotificationPreference)
  notificationPreference(@CurrentUser() user: AuthUser) {
    return this.notificationService.getPreference(user.id);
  }

  @Mutation(() => NotificationPreference)
  updateNotificationPreference(
    @CurrentUser() user: AuthUser,
    @Args('input') input: UpdateNotificationPreferenceInput,
  ) {
    return this.notificationService.updatePreference(user.id, input);
  }
}
