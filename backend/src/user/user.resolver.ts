import { Resolver, Query, Mutation, Args, ResolveField, Parent, Int } from '@nestjs/graphql';
import { UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { PetService } from '../pet/pet.service';
import { CalendarService } from '../calendar/calendar.service';
import { UserService } from './user.service';
import { User, UpdateProfileInput } from './user.types';
import { CalendarEvent, UpcomingSchedule } from '../calendar/calendar.types';
import { Pet } from '../pet/pet.types';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@Resolver(() => User)
@UseGuards(GqlAuthGuard)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly petService: PetService,
    private readonly calendarService: CalendarService,
  ) {}

  @Query(() => User)
  async me(@CurrentUser() authUser: AuthUser) {
    const user = await this.userService.findById(authUser.id);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }

  @Mutation(() => User)
  async updateProfile(@CurrentUser() authUser: AuthUser, @Args('input') input: UpdateProfileInput) {
    if (!input.name) throw new BadRequestException('변경할 내용이 없습니다.');
    return this.userService.updateProfile(authUser.id, input.name);
  }

  @ResolveField(() => [Pet])
  pets(@Parent() user: User) {
    return this.petService.findAll(user.id);
  }

  @ResolveField(() => [String])
  recordDates(
    @Parent() user: User,
    @Args('limit', { type: () => Int, defaultValue: 90 }) limit: number,
  ): Promise<string[]> {
    return this.userService.getRecordDates(user.id, limit);
  }

  @ResolveField(() => [CalendarEvent])
  calendarEvents(
    @Parent() user: User,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ): Promise<CalendarEvent[]> {
    return this.calendarService.getCalendarEvents(user.id, startDate, endDate);
  }

  @ResolveField(() => [UpcomingSchedule])
  upcomingSchedules(
    @Parent() user: User,
    @Args('limit', { type: () => Int, defaultValue: 3 }) limit: number,
  ): Promise<UpcomingSchedule[]> {
    return this.calendarService.getUpcomingSchedules(user.id, limit);
  }
}
