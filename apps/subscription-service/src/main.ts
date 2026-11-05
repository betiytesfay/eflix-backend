import { NestFactory } from '@nestjs/core';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { SubscriptionServiceModule } from './subscription-service.module';

async function bootstrap() {
  const app = await NestFactory.create(SubscriptionServiceModule);
  app.setGlobalPrefix('api');
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'subscription',
      protoPath: join(
        __dirname,
        '../../../../libs/common/src/proto/subscription.proto',
      ),
      url: '0.0.0.0:50051',
    },
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue:
        process.env.RABBITMQ_SUBSCRIPTION_QUEUE || 'subscription_service_queue',
      queueOptions: { durable: true },
    },
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.startAllMicroservices();
  const port = process.env.SUBSCRIPTION_SERVICE_PORT || 5003;
  await app.listen(port);
  console.log(
    `Subscription service running on port http://localhost:${port} and gPRC 0.0.0.0:50051`,
  );
}
bootstrap();
