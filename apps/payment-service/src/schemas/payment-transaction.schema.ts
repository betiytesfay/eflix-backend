import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum PaymentProvider {
  CHAPA = 'CHAPA',
  TELEBIRR = 'TELEBIRR',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class PaymentTransaction extends Document {
  @Prop({ required: true, unique: true, index: true })
  txRef: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  planId: string;

  @Prop({ required: false })
  movieId?: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'ETB' })
  currency: string;

  @Prop({
    required: true,
    enum: PaymentProvider,
    default: PaymentProvider.CHAPA,
  })
  provider: PaymentProvider;

  @Prop({
    required: true,
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Prop({ required: false })
  paymentUrl?: string;
}

export const PaymentTransactionSchema =
  SchemaFactory.createForClass(PaymentTransaction);
