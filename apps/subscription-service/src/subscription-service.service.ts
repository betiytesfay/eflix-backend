import { Injectable } from '@nestjs/common';

@Injectable()
export class SubscriptionServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
