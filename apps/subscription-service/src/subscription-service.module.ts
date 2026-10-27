import { Module } from '@nestjs/common';
import { SubscriptionServiceController } from './subscription-service.controller';
import { SubscriptionServiceService } from './subscription-service.service';

@Module({
  imports: [],
  controllers: [SubscriptionServiceController],
  providers: [SubscriptionServiceService],
})
export class SubscriptionServiceModule {}
