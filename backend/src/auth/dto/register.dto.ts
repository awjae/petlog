import {
  IsBoolean,
  IsEmail,
  IsString,
  IsOptional,
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
}
