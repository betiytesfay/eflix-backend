import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { CheckoutDto } from './dto/checkout.dto';
import {
  PaymentTransaction,
  PaymentProvider,
  TransactionStatus,
} from './schemas/payment-transaction.schema';

@Injectable()
export class PaymentServiceService {
  private readonly logger = new Logger(PaymentServiceService.name);

  constructor(
    @InjectModel(PaymentTransaction.name)
    private transactionModel: Model<PaymentTransaction>,
    private configService: ConfigService,

    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,

    @Inject('SUBSCRIPTION_SERVICE')
    private readonly subscriptionClient: ClientProxy,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const txRef = `eflix-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const transaction = await this.transactionModel.create({
      txRef,
      userId,
      planId: dto.planId,
      movieId: dto.movieId,
      amount: dto.amount,
      currency: 'ETB',
      provider: PaymentProvider.CHAPA,
      status: TransactionStatus.PENDING,
    });

    const chapaSecretKey =
      this.configService.get<string>('CHAPA_SECRET_KEY') ||
      'CHASECK_TEST-demo-key';

    this.logger.log(
      `Initializing Chapa checkout for user ${userId}, amount: ${dto.amount} ETB, txRef: ${txRef}`,
    );

    try {
      const response = await fetch(
        'https://api.chapa.co/v1/transaction/initialize',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${chapaSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: dto.amount.toString(),
            currency: 'ETB',
            email: dto.email,
            first_name: dto.firstName,
            phone_number: dto.phoneNumber,
            tx_ref: txRef,
            callback_url:
              this.configService.get<string>('PAYMENT_CALLBACK_URL') ||
              'http://localhost:5004/api/payments/webhook',
            return_url:
              this.configService.get<string>('FRONTEND_PAYMENT_SUCCESS_URL') ||
              'http://localhost:3000/payment/success',
            'customization[title]': 'Eflix Subscription',
            'customization[description]': 'Payment for Eflix movie streaming',
          }),
        },
      );

      const chapaData = await response.json();

      if (chapaData.status === 'success' && chapaData.data?.checkout_url) {
        transaction.paymentUrl = chapaData.data.checkout_url;
        await transaction.save();

        return {
          message: 'Payment initialized. Redirect user to checkoutUrl.',
          checkoutUrl: chapaData.data.checkout_url,
          txRef,
        };
      }

      const mockCheckoutUrl = `https://checkout.chapa.co/checkout/test/${txRef}`;
      transaction.paymentUrl = mockCheckoutUrl;
      await transaction.save();

      return {
        message: 'Payment initialized (test mode).',
        checkoutUrl: mockCheckoutUrl,
        txRef,
      };
    } catch (error) {
      this.logger.error(`Chapa initialization failed: ${error.message}`);
      throw new BadRequestException('Failed to initialize payment with Chapa');
    }
  }

  async handleWebhook(data: any) {
    const txRef = data.tx_ref || data.trx_ref;

    if (!txRef) {
      throw new BadRequestException('Missing tx_ref in webhook payload');
    }

    const transaction = await this.transactionModel.findOne({ txRef });
    if (!transaction) {
      throw new NotFoundException(`Transaction with txRef ${txRef} not found`);
    }

    if (transaction.status === TransactionStatus.COMPLETED) {
      return { message: 'Transaction already processed' };
    }

    transaction.status = TransactionStatus.COMPLETED;
    await transaction.save();

    this.logger.log(`Payment confirmed for txRef: ${txRef}`);

    const payload = {
      userId: transaction.userId,
      planId: transaction.planId,
      movieId: transaction.movieId,
      paymentMethod: 'CHAPA',
      amount: transaction.amount,
      paidAt: new Date(),
    };

    this.subscriptionClient.emit('payment.success', payload);
    this.notificationClient.emit('payment.success', payload);

    return { message: 'Webhook processed, subscription activated' };
  }
}
