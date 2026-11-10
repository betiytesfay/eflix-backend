import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Movie } from './movie.schema';

@Schema({ timestamps: true })
export class WatchProgress extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Movie.name,
    required: true,
  })
  movie: Movie;

  @Prop({ required: true, min: 0 })
  progressSeconds: number;

  @Prop({ required: true, min: 0 })
  durationSeconds: number;

  @Prop({ default: false })
  isCompleted: boolean;
}

export const WatchProgressSchema = SchemaFactory.createForClass(WatchProgress);
WatchProgressSchema.index({ userId: 1, movie: 1 }, { unique: true });
