import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentResolver } from './appointment.resolver';
import { PetModule } from '../pet/pet.module';

@Module({
  imports: [PetModule],
  providers: [AppointmentService, AppointmentResolver],
})
export class AppointmentModule {}
