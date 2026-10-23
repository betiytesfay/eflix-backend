import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MovieServiceModule } from './movie-service.module';

async function bootstrap() {
  const app = await NestFactory.create(MovieServiceModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.MOVIE_SERVICE_PORT || 5002;
  await app.listen(port);
  console.log(`🎬 Movie Service is running on http://localhost:${port}/api`);
}
bootstrap();
