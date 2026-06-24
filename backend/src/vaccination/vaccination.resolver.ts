import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VaccinationService } from './vaccination.service';
import { Vaccination, CreateVaccinationInput, UpdateVaccinationInput } from './vaccination.types';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@Resolver(() => Vaccination)
@UseGuards(GqlAuthGuard)
export class VaccinationResolver {
  constructor(private readonly vaccinationService: VaccinationService) {}

  @Query(() => [Vaccination])
  vaccinations(@CurrentUser() user: AuthUser, @Args('petId', { type: () => ID }) petId: string) {
    return this.vaccinationService.findAll(user.id, petId);
  }

  @Query(() => [Vaccination])
  upcomingVaccinations(@CurrentUser() user: AuthUser) {
    return this.vaccinationService.findUpcoming(user.id);
  }

  @Mutation(() => Vaccination)
  createVaccination(@CurrentUser() user: AuthUser, @Args('input') input: CreateVaccinationInput) {
    return this.vaccinationService.create(user.id, input);
  }

  @Mutation(() => Vaccination)
  updateVaccination(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateVaccinationInput,
  ) {
    return this.vaccinationService.update(user.id, id, input);
  }

  @Mutation(() => Boolean)
  deleteVaccination(@CurrentUser() user: AuthUser, @Args('id', { type: () => ID }) id: string) {
    return this.vaccinationService.remove(user.id, id);
  }
}
