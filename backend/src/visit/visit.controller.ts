import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { RecordVisitDto } from './dto/record-visit.dto';
import { VisitService } from './visit.service';

// 인증 없는 공개 수집 엔드포인트. 남용을 막으려고 IP당 분당 30회로 제한한다.
@ApiTags('visit')
@Controller('visits')
export class VisitController {
  constructor(private readonly visitService: VisitService) {}

  @Post()
  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: '공개 페이지 방문 기록 (개인정보 없음)' })
  async record(@Body() dto: RecordVisitDto): Promise<void> {
    await this.visitService.record(dto);
  }
}
