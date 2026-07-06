import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawAccountDto {
  @ApiProperty({ description: '본인 확인용 현재 비밀번호' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
