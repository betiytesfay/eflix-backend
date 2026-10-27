import { Controller} from '@nestjs/common';
import {EventPattern, Payload} from '@nestjs/microservices';
import { NotificationServiceService , UserCreatedPayload } from './notification-service.service';

@Controller()
export class NotificationServiceController {
  constructor(private readonly notificationServiceService: NotificationServiceService) {}

 
  @EventPattern('user.created')
      async handleUserCreated(@Payload() data: UserCreatedPayload){
        await this.notificationServiceService.sendWelcomeNotification(data);

    
  }
    
}
