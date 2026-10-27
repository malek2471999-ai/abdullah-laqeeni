import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(require('express').json({ limit: '128kb' }));
  app.set('trust proxy', 1);
  app.enableCors({
    origin: config.get<string[]>('corsOrigins') ?? ['http://localhost:3000'],
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    maxAge: 86400,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.enableShutdownHooks();
  await app.get(PrismaService).enableShutdownHooks(app);

  const port = Number(config.get('PORT') ?? 4000);
  await app.listen(port, '0.0.0.0');
  logger.log(`Abdullah Laqeeni API listening on http://0.0.0.0:${port}`);
  logger.log(`Environment: ${config.get('NODE_ENV') ?? 'development'}`);
}

void bootstrap();
