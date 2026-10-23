import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RecordVisitDto } from './dto/record-visit.dto';

// 퍼널 분석에는 최근 몇 달이면 충분하고, 무인증 쓰기 테이블이라 상한이 없으면 계속 커진다.
export const VISIT_RETENTION_DAYS = 90;

@Injectable()
export class VisitService {
  constructor(private readonly prisma: PrismaService) {}

  async record(dto: RecordVisitDto): Promise<void> {
    await this.prisma.visitEvent.create({ data: dto });
  }

  async deleteExpired(now: Date = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - VISIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.visitEvent.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return count;
  }
}
