import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionServiceController } from './subscription-service.controller';
import { SubscriptionServiceService } from './subscription-service.service';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { GuestUsage, GuestUsageSchema } from './schemas/guest-usage.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI') || 'mongodb://localhost:27017/eflix',
      }),
    }),

    // 3. Registers our two schemas so our Service can use them
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: GuestUsage.name, schema: GuestUsageSchema },
    ]),
  ],
  controllers: [SubscriptionServiceController],
  providers: [SubscriptionServiceService],
  exports: [SubscriptionServiceService],
})
export class SubscriptionServiceModule {}
