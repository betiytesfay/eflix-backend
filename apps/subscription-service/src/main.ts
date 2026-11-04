import { NestFactory } from '@nestjs/core';

import {MicroserviceOptions, Transport} from  '@nestjs/microservices';
import {join} from 'path';
 import { SubscriptionServiceModule } from './subscription-service.module';

async function bootstrap() {
  const app = await NestFactory.create(SubscriptionServiceModule);
  app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.GRPC,
      options:{
        package:' subscription',
        protoPath: join(__dirname, '../../../../libs/common/src/proto/subscription.proto'),
        url: '0.0.0.0:50051',
      }
  });
  await app.startAllMicroservices();
  const port = process.env.SUBSCRIPTION_SERVICE_PORT || 5003;
  await app.listen(port);
  console.log(`Subscription service running on port http://localhost:${port} and gPRC 0.0.0.0:50051`);
  
  
}
bootstrap(); 
