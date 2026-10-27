import { Injectable, Logger } from '@nestjs/common';
export interface UserCreatedPayload{
  userId: string;
  phoneNumber: string;
  email?: string;
  username: string;
}
@Injectable()
export class NotificationServiceService {
 private readonly logger = new Logger(NotificationServiceService.name);
 async sendWelcomeNotification(data: UserCreatedPayload){
    this.logger.log(`New user ${data.username}`);
    if(data.email){this.logger.log(`Sending welcome email to ${data.email}`);
    }
    if(data.phoneNumber){
      this.logger.log(`Sending welcome SMS to ${data.phoneNumber}` );
    }
 }
}
