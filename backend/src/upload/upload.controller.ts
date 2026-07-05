import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { STORAGE_PROVIDER, type StorageProvider } from './storage-provider.interface';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// TODO(2): 현재 파일 타입 검증이 클라이언트가 선언한 mimetype 기반임.
//   프로덕션 전환 시 file-type 패키지 등으로 magic-bytes 검증을 추가할 것.

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider) {}

  @Post('image')
  @ApiOperation({ summary: '이미지 업로드 (최대 5MB, jpeg/png/webp/gif)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!IMAGE_TYPES.includes(file.mimetype)) {
          return cb(new BadRequestException('jpeg, png, webp, gif 형식만 허용됩니다'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('파일이 없습니다');

    const key = `${randomUUID()}${extname(file.originalname)}`;
    return this.storageProvider.upload(file.buffer, key, file.mimetype);
  }
}
