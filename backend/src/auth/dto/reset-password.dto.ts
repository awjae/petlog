import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: '이메일로 전달받은 재설정 토큰(원문)' })
  @IsString()
  token!: string;

  // register.dto.ts의 비밀번호 검증 규칙과 동일하게 유지한다.
  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
