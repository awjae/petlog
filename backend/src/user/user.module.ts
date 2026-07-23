import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { PetModule } from '../pet/pet.module';
import { ConsentModule } from '../consent/consent.module';

@Module({
  imports: [PetModule, ConsentModule],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
