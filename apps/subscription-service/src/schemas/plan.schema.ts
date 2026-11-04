import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PlanType } from './subscription.schema';

@Schema({ timestamps: true })
export class Plan extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: PlanType })
  type: PlanType;

  @Prop({ required: true })
  price: number;
  @Prop({ required: true, default: 'ETB' })
  currency: string;
  @Prop({ required: true })
  durationDays: number;
  @Prop({ required: true })
  description: string;
  @Prop({ default: true })
  isActive: boolean;
}
export const PlanSchema = SchemaFactory.createForClass(Plan);
