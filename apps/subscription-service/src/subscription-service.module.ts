import { Module } from '@nestjs/common';
import { RmqModule, JwtStrategy } from '@app/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionServiceController } from './subscription-service.controller';
import { SubscriptionServiceService } from './subscription-service.service';
import { JwtModule } from '@nestjs/jwt';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';
import { GuestUsage, GuestUsageSchema } from './schemas/guest-usage.schema';
import { Plan, PlanSchema } from './schemas/plan.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    RmqModule.register({ name: 'SUBSCRIPTION_SERVICE' }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGO_URI') || 'mongodb://localhost:27017/eflix',
      }),
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_jwt_key_2026',
      signOptions: { expiresIn: '7d' },
    }),

    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: GuestUsage.name, schema: GuestUsageSchema },
      { name: Plan.name, schema: PlanSchema },
    ]),
  ],
  controllers: [SubscriptionServiceController],
  providers: [SubscriptionServiceService, JwtStrategy],
  exports: [SubscriptionServiceService],
})
export class SubscriptionServiceModule {}
