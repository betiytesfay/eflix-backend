import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

// 🧠 WHAT IS main.ts?
// This is the entry point — same role as your old main.ts.
// But instead of: import app from './server'; app.listen(port)
// We use NestFactory to boot the entire module system.

async function bootstrap() {
  // 🧠 NestFactory.create(AppModule)
  // Reads AppModule, discovers all imported modules, controllers, services,
  // wires up dependency injection, and creates the underlying Express app.
  // Yes — NestJS runs ON TOP of Express by default! Same HTTP engine.
  const app = await NestFactory.create(AppModule);

  // 🧠 Global prefix → all routes become /api/...
  // Compare to Express: app.use('/api', apiRouter)
  // Here it's one line that applies to EVERY controller automatically.
  app.setGlobalPrefix('api');

  // 🧠 CORS — same as your Express cors() middleware
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // 🧠 ValidationPipe — THE KEY LINE for DTOs to work
  // This tells NestJS: "For every route, validate the request body
  // against the DTO class using class-validator decorators."
  //
  // whitelist: true  → strips any extra fields not in the DTO (security)
  // transform: true  → converts plain JSON to actual DTO class instances
  //                    (needed for @IsEmail() and type coercion to work)
  //
  // Without this line, the @IsString(), @MinLength() decorators in DTOs
  // do NOTHING — this pipe is what activates them globally.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,  // remove unknown fields
      transform: true,  // transform payloads to DTO instances
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚀 eflix API is running on http://localhost:${port}/api`);
  console.log(`   Auth routes:`);
  console.log(`   POST http://localhost:${port}/api/auth/register`);
  console.log(`   POST http://localhost:${port}/api/auth/login`);
  console.log(`   GET  http://localhost:${port}/api/auth/me  [🔒 JWT required]\n`);
}

bootstrap();
