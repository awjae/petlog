import { BadRequestException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import { UploadController } from './upload.controller';
import type { StorageProvider } from './storage-provider.interface';

// file-type은 ESM 전용 패키지라 ts-jest(CommonJS)가 실제 모듈을 로드하지 못한다.
// 매직바이트 판별 자체의 정확도는 file-type 패키지 자신의 책임 영역이니, 여기서는
// "감지 결과에 따라 컨트롤러가 올바르게 분기하는지"만 검증하고 file-type은 mock한다.
// (실제 런타임에서 진짜로 동작하는지는 로컬에서 서버를 띄워 라이브로 확인했다.)
jest.mock('file-type', () => ({ fileTypeFromBuffer: jest.fn() }));
const mockedFileTypeFromBuffer = fileTypeFromBuffer as jest.Mock;

const FAKE_BUFFER = Buffer.from('irrelevant — file-type is mocked');

function buildFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    buffer: FAKE_BUFFER,
    mimetype: 'image/jpeg',
    originalname: 'photo.jpg',
    fieldname: 'file',
    encoding: '7bit',
    size: FAKE_BUFFER.length,
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

describe('UploadController', () => {
  let controller: UploadController;
  let storageProvider: jest.Mocked<StorageProvider>;

  beforeEach(() => {
    mockedFileTypeFromBuffer.mockReset();
    storageProvider = { upload: jest.fn().mockResolvedValue({ url: 'https://cdn/uploaded' }) };
    controller = new UploadController(storageProvider);
  });

  it('실제 바이트가 이미지로 감지되면, 클라이언트가 선언한 값이 아니라 감지된 타입으로 저장한다', async () => {
    // 클라이언트는 png/photo.png라고 선언했지만 실제 바이트는 jpeg로 감지된 상황 —
    // 이 컨트롤러가 신뢰해야 하는 건 감지 결과이지 클라이언트 선언이 아니다.
    mockedFileTypeFromBuffer.mockResolvedValue({ ext: 'jpg', mime: 'image/jpeg' });
    const file = buildFile({ mimetype: 'image/png', originalname: 'photo.png' });

    const result = await controller.uploadImage(file);

    expect(storageProvider.upload).toHaveBeenCalledWith(
      file.buffer,
      expect.stringMatching(/\.jpg$/),
      'image/jpeg',
    );
    expect(result).toEqual({ url: 'https://cdn/uploaded' });
  });

  it('실제 바이트가 이미지로 감지되지 않으면 mimetype/확장자를 속였어도 거부한다', async () => {
    mockedFileTypeFromBuffer.mockResolvedValue(undefined);
    const disguised = buildFile({ mimetype: 'image/png', originalname: 'harmless.png' });

    await expect(controller.uploadImage(disguised)).rejects.toThrow(BadRequestException);
    expect(storageProvider.upload).not.toHaveBeenCalled();
  });

  it('감지된 타입이 허용 목록(jpeg/png/webp/gif) 밖이면 거부한다', async () => {
    mockedFileTypeFromBuffer.mockResolvedValue({ ext: 'pdf', mime: 'application/pdf' });
    const file = buildFile();

    await expect(controller.uploadImage(file)).rejects.toThrow(BadRequestException);
    expect(storageProvider.upload).not.toHaveBeenCalled();
  });

  it('파일이 없으면 거부한다', async () => {
    await expect(
      controller.uploadImage(undefined as unknown as Express.Multer.File),
    ).rejects.toThrow(BadRequestException);
    expect(storageProvider.upload).not.toHaveBeenCalled();
  });
});
