import { Controller, Get } from '@nestjs/common';
import { SubscriptionServiceService } from './subscription-service.service';

@Controller()
export class SubscriptionServiceController {
  constructor(private readonly subscriptionServiceService: SubscriptionServiceService) {}

  @Get()
  getHello(): string {
    return this.subscriptionServiceService.getHello();
  }
}
