import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../common/prisma/prisma.service';

class RecordVisitDto {
  @IsString()
  @MaxLength(200)
  path!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  utmSource?: string;
}

// 인증 없는 공개 수집 엔드포인트. 남용을 막으려고 IP당 분당 30회로 제한한다.
@ApiTags('visit')
@Controller('visits')
export class VisitController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: '공개 페이지 방문 기록 (개인정보 없음)' })
  async record(@Body() dto: RecordVisitDto): Promise<void> {
    await this.prisma.visitEvent.create({ data: dto });
  }
}
