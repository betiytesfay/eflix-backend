import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  NotificationServiceService,
  UserCreatedPayload,
  MovieCreatedPayload,
  PaymentSuccessPayload,
} from './notification-service.service';

@Controller()
export class NotificationServiceController {
  constructor(
    private readonly notificationServiceService: NotificationServiceService,
  ) {}

  @EventPattern('user.created')
  async handleUserCreated(@Payload() data: UserCreatedPayload) {
    await this.notificationServiceService.sendWelcomeNotification(data);
  }

  @EventPattern('movie.created')
  async handleMovieCreated(@Payload() data: MovieCreatedPayload) {
    await this.notificationServiceService.sendNewMovieBroadcast(data);
  }
  @EventPattern('payment.success')
  async handlePaymentSuccess(@Payload() data: PaymentSuccessPayload) {
    await this.notificationServiceService.sendPaymentConfirmation(data);
  }
}
