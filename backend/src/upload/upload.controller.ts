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
import { randomUUID } from 'crypto';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { STORAGE_PROVIDER, type StorageProvider } from './storage-provider.interface';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

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
      // multer는 파일 스트림을 다 받기 전에 fileFilter부터 호출하므로 이 시점엔
      // file.buffer가 아직 없다 — 여기서 보는 file.mimetype은 클라이언트가 요청
      // 헤더에 선언한 값일 뿐 실제 내용과 무관하다. 진짜 검증(매직바이트)은 버퍼가
      // 채워진 뒤인 핸들러에서 하고, 이건 명백히 틀린 선언을 조기에 걸러 불필요한
      // 업로드를 막는 값싼 사전 필터일 뿐 보안 경계가 아니다.
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

    // file-type이 ESM 전용 패키지라 CommonJS(backend)에서는 동적 import로 불러온다.
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(file.buffer);

    // 클라이언트가 선언한 mimetype/originalname이 아니라 실제 바이트(매직 넘버)로
    // 판별된 타입만 신뢰한다 — 이게 진짜 보안 경계다.
    if (!detected || !IMAGE_TYPES.includes(detected.mime)) {
      throw new BadRequestException('jpeg, png, webp, gif 형식만 허용됩니다');
    }

    const key = `${randomUUID()}.${detected.ext}`;
    return this.storageProvider.upload(file.buffer, key, detected.mime);
  }
}
