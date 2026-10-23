import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class RecordVisitDto {
  // 무인증 공개 쓰기라 경로 모양이 아닌 값은 받지 않는다.
  @ApiProperty({ example: '/guides/dog-weight-check' })
  @IsString()
  @MaxLength(200)
  @Matches(/^\/\S*$/)
  path!: string;

  @ApiPropertyOptional({ example: 'search.naver.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referrer?: string;

  @ApiPropertyOptional({ example: 'naver' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  utmSource?: string;
}
