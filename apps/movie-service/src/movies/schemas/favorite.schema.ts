import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Movie } from './movie.schema';

@Schema({ timestamps: true })
export class Favorite extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Movie.name,
    required: true,
  })
  movie: Movie;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);
FavoriteSchema.index({ userId: 1, movie: 1 }, { unique: true });
