import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { WithdrawAccountDto } from './dto/withdraw-account.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserService } from '../user/user.service';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/api/auth/refresh',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: '회원가입 — 계정 생성 후 자동 로그인' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.userService.create(dto.email, dto.password, dto.name, dto.consents, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    const { accessToken, refreshToken } = this.authService.createTokens({
      id: user.id,
      email: user.email,
    });

    await this.authService.storeRefreshToken(user.id, refreshToken);

    res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions);
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
    return { message: '회원가입 성공' };
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: '로그인 — access/refresh 쿠키 발급' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.userService.validateUser(dto.email, dto.password);
    const { accessToken, refreshToken } = this.authService.createTokens({
      id: user.id,
      email: user.email,
    });

    await this.authService.storeRefreshToken(user.id, refreshToken);

    res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions);
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);

    const accountPendingDeletion = user.deletionRequestedAt !== null;
    const deletionRemainingDays = accountPendingDeletion
      ? this.authService.getDeletionRemainingDays(user.deletionRequestedAt)
      : null;

    return { message: '로그인 성공', accountPendingDeletion, deletionRemainingDays };
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(JwtRefreshGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Access/Refresh token 재발급 (RTR)' })
  async refresh(
    @Req() req: Request & { user: { id: string; email: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldRefreshToken = req.cookies[REFRESH_COOKIE] as string;

    const { accessToken, refreshToken } = await this.authService.rotateRefreshToken(
      req.user.id,
      oldRefreshToken,
      req.user,
    );

    res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions);
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
    return { message: '토큰 갱신 성공' };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: '로그아웃 — 쿠키 삭제 및 Refresh Token 폐기' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    if (rawToken) {
      try {
        const payload = this.authService.verifyRefreshToken(rawToken);
        await this.authService.revokeRefreshToken(payload.sub, rawToken);
      } catch {
        // 만료된 토큰이어도 쿠키는 삭제
      }
    }

    res.clearCookie(ACCESS_COOKIE, accessCookieOptions);
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
    return { message: '로그아웃 성공' };
  }

  @Post('withdraw')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiCookieAuth()
  @ApiOperation({ summary: '계정 삭제(탈퇴) — 소프트 삭제 + 30일 그레이스 기간 시작' })
  async withdraw(
    @Body() dto: WithdrawAccountDto,
    @Req() req: Request & { user: { id: string; email: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.withdrawAccount(req.user.id, dto.password);

    res.clearCookie(ACCESS_COOKIE, accessCookieOptions);
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
    return { message: '탈퇴 처리되었어요. 30일 이내 로그인하면 복구할 수 있어요.' };
  }

  @Post('restore')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: '계정 복구 — 그레이스 기간 중 재로그인 후 탈퇴 취소' })
  async restore(@Req() req: Request & { user: { id: string; email: string } }) {
    await this.authService.restoreAccount(req.user.id);
    return { message: '계정이 복구되었어요.' };
  }

  @Post('forgot-password')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: '비밀번호 찾기 — 계정 존재 여부와 무관하게 항상 동일한 응답' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
    // 계정 존재 여부를 노출하지 않기 위해(enumeration 방지) 항상 동일한 성공 메시지를 반환한다.
    return { message: '입력하신 이메일이 가입 시 사용한 주소라면, 재설정 링크를 보내드렸어요.' };
  }

  @Get('reset-password/verify')
  @HttpCode(200)
  @ApiOperation({
    summary: '비밀번호 재설정 토큰 검증 — 만료/사용됨/미존재를 구분하지 않고 통일된 응답',
  })
  async verifyResetPasswordToken(@Query('token') token?: string) {
    if (!token) throw new BadRequestException('token 파라미터가 필요합니다.');

    const valid = await this.authService.verifyPasswordResetToken(token);
    return { valid };
  }

  @Post('reset-password')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: '비밀번호 재설정 — 토큰 소모 + 전 기기 세션 무효화' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: '비밀번호가 변경되었습니다.' };
  }
}
