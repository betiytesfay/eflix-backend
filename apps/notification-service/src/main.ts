import {NestFactory} from '@nestjs/core';
import {MicroserviceOptions, Transport} from '@nestjs/microservices';
import {NotificationServiceModule} from './notification-service.module';
async function bootstrap(){
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(NotificationServiceModule,{
    transport : Transport.RMQ,
    options:{
      urls:[process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: process.env.RABBBITMQ_NOTIFICATION_QUEUE || 'notification_service_queue',
      queueOptions:{
        durable:true
      }
    }
  });
  await app.listen(); 
  console.log(`Notification Service is listening for RabbitMQ `);

}
bootstrap();