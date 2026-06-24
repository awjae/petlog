import { Module } from '@nestjs/common';
import { VaccinationService } from './vaccination.service';
import { VaccinationResolver } from './vaccination.resolver';
import { PetModule } from '../pet/pet.module';

@Module({
  imports: [PetModule],
  providers: [VaccinationService, VaccinationResolver],
})
export class VaccinationModule {}
