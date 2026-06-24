import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MedicalEventService } from './medical-event.service';
import {
  MedicalEvent,
  CreateMedicalEventInput,
  UpdateMedicalEventInput,
} from './medical-event.types';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@Resolver(() => MedicalEvent)
@UseGuards(GqlAuthGuard)
export class MedicalEventResolver {
  constructor(private readonly medicalEventService: MedicalEventService) {}

  @Query(() => [MedicalEvent])
  medicalEvents(@CurrentUser() user: AuthUser, @Args('petId', { type: () => ID }) petId: string) {
    return this.medicalEventService.findAll(user.id, petId);
  }

  @Mutation(() => MedicalEvent)
  createMedicalEvent(@CurrentUser() user: AuthUser, @Args('input') input: CreateMedicalEventInput) {
    return this.medicalEventService.create(user.id, input);
  }

  @Mutation(() => MedicalEvent)
  updateMedicalEvent(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateMedicalEventInput,
  ) {
    return this.medicalEventService.update(user.id, id, input);
  }

  @Mutation(() => Boolean)
  deleteMedicalEvent(@CurrentUser() user: AuthUser, @Args('id', { type: () => ID }) id: string) {
    return this.medicalEventService.remove(user.id, id);
  }
}
