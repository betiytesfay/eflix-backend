import { NestFactory } from '@nestjs/core';
import { SubscriptionServiceModule } from './subscription-service.module';

async function bootstrap() {
  const app = await NestFactory.create(SubscriptionServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
