import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class PaymentServiceService {
  private readonly logger = new Logger(PaymentServiceService.name);
  constructor(
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,

    @Inject('SUBSCRIPTION_SERVICE')
    private readonly subscriptionClient: ClientProxy,
  ) {}
  async checkout(userId: string, dto: CheckoutDto) {
    this.logger.log(
      `Processing payment for user ${userId}, plan ${dto.planId} via ${dto.paymentMethod}`,
    );
    const payload = {
      userId,
      planId: dto.planId,
      movieId: dto.movieId,
      paymentMethod: dto.paymentMethod,
      paidAt: new Date(),
    };
    this.subscriptionClient.emit('payment.success', payload);
    this.notificationClient.emit('payment.success', payload);
    this.logger.log(`payment.success event emitted for user ${userId}`);
    return {
      message: 'Payment Succcessful! Your subscription is being activated.',
      payload,
    };
  }
}
