import {
  IsBoolean,
  IsEmail,
  IsString,
  IsOptional,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConsentsDto {
  @ApiProperty({ description: '이용약관 동의 (필수)' })
  @IsBoolean()
  termsOfService!: boolean;

  @ApiProperty({ description: '개인정보처리방침 동의 (필수)' })
  @IsBoolean()
  privacyPolicy!: boolean;

  @ApiProperty({ description: '마케팅 정보 수신 동의 (선택)' })
  @IsBoolean()
  marketingNotification!: boolean;
}

// 가입 경로(first-touch). 클라이언트가 보내는 값이라 신뢰할 수 없지만, 계측용이라 형식만
// 막는다 — 제약은 방문 로그(RecordVisitDto)와 같다.
export class SignupAttributionDto {
  @ApiPropertyOptional({ example: '/guides/dog-weight-check' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^\/\S*$/)
  landingPath?: string;

  @ApiPropertyOptional({ example: 'search.naver.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referrer?: string;

  @ApiPropertyOptional({ example: 'instagram' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  utmSource?: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: '홍길동' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ type: ConsentsDto, description: '회원가입 동의 항목' })
  @ValidateNested()
  @Type(() => ConsentsDto)
  consents!: ConsentsDto;

  @ApiPropertyOptional({ type: SignupAttributionDto, description: '가입 경로 (계측용, 선택)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SignupAttributionDto)
  attribution?: SignupAttributionDto;
}
