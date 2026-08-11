import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { PetModule } from '../pet/pet.module';
import { HealthRecordModule } from '../health-record/health-record.module';
import { VaccinationModule } from '../vaccination/vaccination.module';
import { MedicationModule } from '../medication/medication.module';
import { AppointmentModule } from '../appointment/appointment.module';
import { MedicalEventModule } from '../medical-event/medical-event.module';

// 여러 도메인을 모으는 것이 이 모듈의 존재 이유이므로 import가 많은 것은 의도된 모습이다.
// 이 fan-out을 UserModule에 두면 User가 5개 도메인을 아는 god module이 된다.
@Module({
  imports: [
    PetModule,
    HealthRecordModule,
    VaccinationModule,
    MedicationModule,
    AppointmentModule,
    MedicalEventModule,
  ],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
