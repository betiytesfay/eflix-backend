import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document} from 'mongoose';
@Schema({timestamps: true})
export class GuestUsage extends Document{
    @Prop({required: true, index: true})
    ipAddress: string;
    @Prop({required: true, index: true})
    month: string;
    @Prop({type:[String], default: []})
    watchedMovies: string[];
    @Prop({default: 0})
    count: number;
}
export const GuestUsageSchema = SchemaFactory.createForClass(GuestUsage);
GuestUsageSchema.index({ ipAddress:1, month:1}, {unique: true});
