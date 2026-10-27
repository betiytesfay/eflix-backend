import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document} from 'mongoose';

export enum PlanType{
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY',
    PAY_PER_VIEW= 'PAY_PER_VIEW'
}
export enum SubscriptionStatus{
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED'
}

@Schema({ timestamps: true})
export class Subscription extends Document {
    @Prop({ required: true, index:true })
    userId: string;
    @Prop({ required:true, enum:PlanType })
    plan:PlanType;
   @Prop({required:true, enum:SubscriptionStatus, default:SubscriptionStatus.ACTIVE})
   status: SubscriptionStatus;
    @Prop({required:false})
   movieId?:string;
   @Prop({required:true})
   endDate: Date;
   @Prop({default:true})
   autoRenew: boolean;

} 
export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);