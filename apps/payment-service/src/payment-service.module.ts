import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RmqModule, JwtStrategy } from '@app/common';
import { PaymentServiceController } from './payment-service.controller';
import { PaymentServiceService } from './payment-service.service';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from './schemas/payment-transaction.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_jwt_key_2026',
      signOptions: { expiresIn: '7d' },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGO_URI') || 'mongodb://localhost:27017/eflix',
      }),
    }),
    MongooseModule.forFeature([
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
    ]),
    RmqModule.register({ name: 'NOTIFICATION_SERVICE' }),
    RmqModule.register({ name: 'SUBSCRIPTION_SERVICE' }),
  ],
  controllers: [PaymentServiceController],
  providers: [PaymentServiceService, JwtStrategy],
})
export class PaymentServiceModule {}
