import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionServiceController } from './subscription-service.controller';
import { SubscriptionServiceService } from './subscription-service.service';

describe('SubscriptionServiceController', () => {
  let subscriptionServiceController: SubscriptionServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionServiceController],
      providers: [SubscriptionServiceService],
    }).compile();

    subscriptionServiceController = app.get<SubscriptionServiceController>(SubscriptionServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(subscriptionServiceController.getHello()).toBe('Hello World!');
    });
  });
});
