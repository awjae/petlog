import { Module } from '@nestjs/common';
import { MedicationService } from './medication.service';
import { MedicationResolver } from './medication.resolver';
import { PetModule } from '../pet/pet.module';

@Module({
  imports: [PetModule],
  providers: [MedicationService, MedicationResolver],
})
export class MedicationModule {}
