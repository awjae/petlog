import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

// ALB 타겟 그룹 헬스체크 전용 엔드포인트. 인증 가드를 붙이지 않는다.
// 경로는 GET /api/health로 고정되며, infra(CDKTF backend-stack의 ALB backend 타겟 그룹)의
// 헬스체크 설정과 하드코딩으로 합의된 값이므로 임의로 변경하지 않는다.
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'ALB 헬스체크용 엔드포인트' })
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
