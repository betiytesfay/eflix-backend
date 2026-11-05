import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PaymentServiceModule } from './payment-service.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentServiceModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const port = process.env.PAYMENT_SERVICE_PORT || 5004;
  await app.listen(port);
  console.log(`Payment service running on http://localhost:${port}`);
}

bootstrap();
