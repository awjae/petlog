import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from './appointment.types';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@Resolver(() => Appointment)
@UseGuards(GqlAuthGuard)
export class AppointmentResolver {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Query(() => [Appointment])
  appointments(@CurrentUser() user: AuthUser, @Args('petId', { type: () => ID }) petId: string) {
    return this.appointmentService.findAll(user.id, petId);
  }

  @Query(() => [Appointment])
  upcomingAppointments(@CurrentUser() user: AuthUser) {
    return this.appointmentService.findUpcoming(user.id);
  }

  @Mutation(() => Appointment)
  createAppointment(@CurrentUser() user: AuthUser, @Args('input') input: CreateAppointmentInput) {
    return this.appointmentService.create(user.id, input);
  }

  @Mutation(() => Appointment)
  updateAppointment(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateAppointmentInput,
  ) {
    return this.appointmentService.update(user.id, id, input);
  }

  @Mutation(() => Boolean)
  deleteAppointment(@CurrentUser() user: AuthUser, @Args('id', { type: () => ID }) id: string) {
    return this.appointmentService.remove(user.id, id);
  }
}
