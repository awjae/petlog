import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// TODO(1): 프로덕션 배포 시 로컬 디스크 저장은 서버 재시작 시 파일이 사라짐.
//   uploadImage 함수를 S3/R2 구현체로 교체할 것.
//   이 컨트롤러의 storage만 바꾸면 나머지 코드(프론트 포함)는 변경 불필요.
const storage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${extname(file.originalname)}`);
  },
});

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// TODO(2): 현재 파일 타입 검증이 클라이언트가 선언한 mimetype 기반임.
//   프로덕션 전환 시 file-type 패키지 등으로 magic-bytes 검증을 추가할 것.

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post('image')
  @ApiOperation({ summary: '이미지 업로드 (최대 5MB, jpeg/png/webp/gif)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!IMAGE_TYPES.includes(file.mimetype)) {
          return cb(new BadRequestException('jpeg, png, webp, gif 형식만 허용됩니다'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('파일이 없습니다');
    return { url: `/api/uploads/${file.filename}` };
  }
}
