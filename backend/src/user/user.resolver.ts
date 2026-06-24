import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { User, UpdateProfileInput } from './user.types';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@Resolver(() => User)
@UseGuards(GqlAuthGuard)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

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
}
