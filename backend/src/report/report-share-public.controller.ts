import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ReportShareService } from './report-share.service';

// 공개(비로그인) 공유 리포트 조회 — REST로 구현한다.
//
// 이 프로젝트의 기존 도메인 API는 전부 GraphQL이지만, 이 엔드포인트는 예외로 둔다:
//   1. rate limiting 패턴(@UseGuards(ThrottlerGuard) + @Throttle)이 이 코드베이스에서
//      AuthController 전용 REST 패턴으로만 존재한다. GraphQL 리졸버에 동일 수준의 방어를
//      적용하려면 GraphQL execution context에서 request를 추출하는 커스텀 Guard를 새로
//      만들어야 해서, 기존 REST 패턴을 그대로 재사용하는 편이 복잡도가 낮다.
//   2. 공유 링크를 받는 사람은 로그인하지 않은 제3자이고, Next.js 쪽에서 이 페이지를
//      서버 컴포넌트에서 바로 fetch해 렌더링하는 편이 자연스럽다(Apollo Client를 굳이
//      비로그인 사용자용으로 초기화할 이유가 없다).
@ApiTags('report-shares')
@Controller('report-shares')
export class ReportSharePublicController {
  constructor(private readonly reportShareService: ReportShareService) {}

  @Get(':token')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: '공유 토큰으로 리포트 공개 조회 — 미존재/비활성 상태를 동일하게 취급',
  })
  async getByToken(@Param('token') token: string) {
    const report = await this.reportShareService.getPublicReport(token);
    if (!report) throw new NotFoundException('공유된 리포트를 찾을 수 없습니다.');
    return report;
  }
}
