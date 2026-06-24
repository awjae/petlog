import { Module } from '@nestjs/common';
import { MedicalEventService } from './medical-event.service';
import { MedicalEventResolver } from './medical-event.resolver';
import { PetModule } from '../pet/pet.module';

@Module({
  imports: [PetModule],
  providers: [MedicalEventService, MedicalEventResolver],
})
export class MedicalEventModule {}
