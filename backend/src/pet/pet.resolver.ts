import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PetService } from './pet.service';
import {
  Pet,
  CreatePetInput,
  UpdatePetInput,
  RecentWeight,
  HealthRecordSummary,
} from './pet.types';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@Resolver(() => Pet)
@UseGuards(GqlAuthGuard)
export class PetResolver {
  constructor(private readonly petService: PetService) {}

  @Query(() => [Pet])
  pets(@CurrentUser() user: AuthUser) {
    return this.petService.findAll(user.id);
  }

  @Query(() => Pet)
  pet(@CurrentUser() user: AuthUser, @Args('id', { type: () => ID }) id: string) {
    return this.petService.findOne(user.id, id);
  }

  @Mutation(() => Pet)
  createPet(@CurrentUser() user: AuthUser, @Args('input') input: CreatePetInput) {
    return this.petService.create(user.id, input);
  }

  @Mutation(() => Pet)
  updatePet(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdatePetInput,
  ) {
    return this.petService.update(user.id, id, input);
  }

  @Mutation(() => Boolean)
  deletePet(@CurrentUser() user: AuthUser, @Args('id', { type: () => ID }) id: string) {
    return this.petService.remove(user.id, id);
  }

  @ResolveField(() => RecentWeight, { nullable: true })
  recentWeight(@Parent() pet: Pet): Promise<RecentWeight | null> {
    return this.petService.findRecentWeight(pet.id);
  }

  @ResolveField(() => Int)
  todayRecordCount(@Parent() pet: Pet): Promise<number> {
    return this.petService.countTodayRecords(pet.id);
  }

  @ResolveField(() => [HealthRecordSummary])
  recentHealthRecords(
    @Parent() pet: Pet,
    @Args('limit', { type: () => Int, defaultValue: 3 }) limit: number,
  ): Promise<HealthRecordSummary[]> {
    return this.petService.findRecentHealthRecords(pet.id, limit);
  }
}
