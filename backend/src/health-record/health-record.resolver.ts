import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { HealthRecordService } from './health-record.service';
import {
  HealthRecord,
  CreateHealthRecordInput,
  UpdateHealthRecordInput,
} from './health-record.types';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@Resolver(() => HealthRecord)
@UseGuards(GqlAuthGuard)
export class HealthRecordResolver {
  constructor(private readonly healthRecordService: HealthRecordService) {}

  @Query(() => [HealthRecord])
  healthRecords(@CurrentUser() user: AuthUser, @Args('petId', { type: () => ID }) petId: string) {
    return this.healthRecordService.findAll(user.id, petId);
  }

  @Mutation(() => HealthRecord)
  createHealthRecord(@CurrentUser() user: AuthUser, @Args('input') input: CreateHealthRecordInput) {
    return this.healthRecordService.create(user.id, input);
  }

  @Mutation(() => HealthRecord)
  updateHealthRecord(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateHealthRecordInput,
  ) {
    return this.healthRecordService.update(user.id, id, input);
  }

  @Mutation(() => Boolean)
  deleteHealthRecord(@CurrentUser() user: AuthUser, @Args('id', { type: () => ID }) id: string) {
    return this.healthRecordService.remove(user.id, id);
  }
}
