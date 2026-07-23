import { Module } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { ConsentResolver } from './consent.resolver';

@Module({
  providers: [ConsentService, ConsentResolver],
  exports: [ConsentService],
})
export class ConsentModule {}
