import { Injectable, Logger } from '@nestjs/common';
export interface UserCreatedPayload {
  userId: string;
  phoneNumber: string;
  email?: string;
  username: string;
}
export interface MovieCreatedPayload {
  id: string;
  title: string;
  genre: string;
  releaseYear: number;
}
export interface PaymentSuccessPayload {
  userId: string;
  planId: string;
  movieId?: string;
  paymentMethod: string;
  paidAt: Date;
}
@Injectable()
export class NotificationServiceService {
  private readonly logger = new Logger(NotificationServiceService.name);
  async sendWelcomeNotification(data: UserCreatedPayload) {
    this.logger.log(`New user ${data.username}`);
    if (data.email) {
      this.logger.log(`Sending welcome email to ${data.email}`);
    }
    if (data.phoneNumber) {
      this.logger.log(`Sending welcome SMS to ${data.phoneNumber}`);
    }
  }
  async sendPaymentConfirmation(data: PaymentSuccessPayload) {
    this.logger.log(
      `Payment confirmed for user ${data.userId} via ${data.paymentMethod}`,
    );
    this.logger.log(`Sending payment confirmation notification...`);
  }
  async sendMovieNotification(data: MovieCreatedPayload) {
    this.logger.log(
      `New movie added: "${data.title}" (${data.releaseYear}) - Genre: ${data.genre}`,
    );
    this.logger.log(`Notifyin all subscribers about the new movie..`);
  }
  async sendNewMovieBroadcast(movie: MovieCreatedPayload) {
    this.logger.log(
      `[BROADCAST] New movie released: "${movie.title}" (${movie.genre})`,
    );
    this.logger.log(`Sending notification to all subscribers`);
  }
}
