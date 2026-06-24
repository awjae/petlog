import { Controller, Post, Body, Res, HttpCode, UseGuards, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
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
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.userService.create(dto.email, dto.password, dto.name);
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
    return { message: '로그인 성공' };
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
}
