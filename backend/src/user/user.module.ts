import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { PetModule } from '../pet/pet.module';
import { ConsentModule } from '../consent/consent.module';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
  imports: [PetModule, ConsentModule, CalendarModule],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
