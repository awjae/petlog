import { Module } from '@nestjs/common';
import { BreedProfileService } from './breed-profile.service';

@Module({
  providers: [BreedProfileService],
  exports: [BreedProfileService],
})
export class AiModule {}
