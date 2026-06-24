import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MedicationService } from './medication.service';
import { Medication, CreateMedicationInput, UpdateMedicationInput } from './medication.types';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@Resolver(() => Medication)
@UseGuards(GqlAuthGuard)
export class MedicationResolver {
  constructor(private readonly medicationService: MedicationService) {}

  @Query(() => [Medication])
  medications(@CurrentUser() user: AuthUser, @Args('petId', { type: () => ID }) petId: string) {
    return this.medicationService.findAll(user.id, petId);
  }

  @Query(() => [Medication])
  activeMedications(
    @CurrentUser() user: AuthUser,
    @Args('petId', { type: () => ID }) petId: string,
  ) {
    return this.medicationService.findActive(user.id, petId);
  }

  @Mutation(() => Medication)
  createMedication(@CurrentUser() user: AuthUser, @Args('input') input: CreateMedicationInput) {
    return this.medicationService.create(user.id, input);
  }

  @Mutation(() => Medication)
  updateMedication(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateMedicationInput,
  ) {
    return this.medicationService.update(user.id, id, input);
  }

  @Mutation(() => Boolean)
  deleteMedication(@CurrentUser() user: AuthUser, @Args('id', { type: () => ID }) id: string) {
    return this.medicationService.remove(user.id, id);
  }
}
