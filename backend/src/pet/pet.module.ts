import { Module } from '@nestjs/common';
import { PetService } from './pet.service';
import { PetResolver } from './pet.resolver';

@Module({
  providers: [PetService, PetResolver],
  exports: [PetService],
})
export class PetModule {}
