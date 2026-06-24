import { Controller, Post, Body, Res, HttpCode, UseGuards, Get, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 15 * 60 * 1000, // 15분
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
  path: '/api/auth/refresh', // refresh 엔드포인트에서만 전송
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: '로그인 — access/refresh 쿠키 발급' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    // TODO: UserService.validateUser(dto.email, dto.password) 연동
    const user = { id: 'placeholder', email: dto.email };
    const { accessToken, refreshToken } = this.authService.createTokens(user);

    res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions);
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);

    return { message: '로그인 성공' };
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(JwtRefreshGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Access token 재발급' })
  refresh(
    @Req() req: Request & { user: { id: string; email: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const newAccessToken = this.authService.refreshAccessToken(req.user);
    res.cookie(ACCESS_COOKIE, newAccessToken, accessCookieOptions);
    return { message: '토큰 갱신 성공' };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: '로그아웃 — 쿠키 삭제' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_COOKIE, accessCookieOptions);
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
    return { message: '로그아웃 성공' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: '현재 사용자 정보' })
  me(@Req() req: Request & { user: { id: string; email: string } }) {
    return req.user;
  }
}
