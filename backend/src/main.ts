import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ECS Fargate + ALB 뒤에 있어서 이 설정 없이는 req.ip가 ALB 내부 IP를 가리킨다.
  // 동의(UserConsent) 증적용 IP, Rate Limiting(ThrottlerGuard) 등 req.ip에 의존하는
  // 모든 로직이 이 설정을 전제로 한다. ALB가 유일한 진입점이므로 hop 1개만 신뢰한다.
  app.set('trust proxy', 1);

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/api/uploads' });

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({ origin: process.env.FRONTEND_URL });

  const config = new DocumentBuilder()
    .setTitle('Petlog API')
    .setDescription('반려동물 건강 기록 서비스 API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
