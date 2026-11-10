import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum MovieAccessType {
  FREE = 'FREE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  PAY_PER_VIEW = 'PAY_PER_VIEW',
}
@Schema({ timestamps: true })
export class Movie extends Document {
  @Prop({ required: true, trim: true })
  title: string;
  @Prop({ default: '', trim: true })
  description: string;
  @Prop({ required: true })
  releaseYear: number;
  @Prop({ trim: true })
  genre: string;
  @Prop({ required: true })
  duration: number;
  @Prop({ default: '' })
  videoUrl: string;
  @Prop({ default: '' })
  thumbnailUrl: string;
  @Prop({ default: '' })
  posterUrl: string;
  @Prop({ default: '' })
  bannerUrl: string;
  @Prop({ default: false })
  isFeatured: boolean;
  @Prop({
    type: String,
    enum: Object.values(MovieAccessType),
    default: MovieAccessType.SUBSCRIPTION,
  })
  accessType: MovieAccessType;
  @Prop({ default: 0 })
  ppvPrice: number;
}
export const MovieSchema = SchemaFactory.createForClass(Movie);
