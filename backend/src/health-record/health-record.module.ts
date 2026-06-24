import { Module } from '@nestjs/common';
import { HealthRecordService } from './health-record.service';
import { HealthRecordResolver } from './health-record.resolver';
import { PetModule } from '../pet/pet.module';

@Module({
  imports: [PetModule],
  providers: [HealthRecordService, HealthRecordResolver],
})
export class HealthRecordModule {}
