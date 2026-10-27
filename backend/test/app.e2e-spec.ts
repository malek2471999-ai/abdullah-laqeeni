import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Smoke test that boots the real Nest module graph with an in-memory Prisma
 * stub. It intentionally does not need PostgreSQL; database behaviour is
 * covered by integration tests against a disposable database in CI.
 */
describe('Abdullah Laqeeni API (e2e)', () => {
  let app: INestApplication;
  let prisma: any;

  beforeAll(async () => {
    prisma = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      enableShutdownHooks: jest.fn(),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      securityEvent: { create: jest.fn().mockResolvedValue({}) },
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / identifies the service', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);
    expect(response.body).toMatchObject({
      name: 'Abdullah Laqeeni API',
      version: '1.0.0',
      status: 'online',
    });
  });

  it('GET /health reports database and push state', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.database).toBe('ok');
    expect(['fcm', 'polling-only']).toContain(response.body.push);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('rejects unauthenticated device listing', async () => {
    await request(app.getHttpServer()).get('/devices').expect(401);
  });

  it('validates registration input before touching the database', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
    expect(response.body.message).toBeDefined();
  });
});
