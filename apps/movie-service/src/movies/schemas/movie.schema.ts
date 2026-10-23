import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document} from 'mongoose';

@Schema({timestamps:  true})
export class Movie extends Document{
    @Prop({ required : true, trim: true})
    title: string;
    @Prop({default:'', trim: true})
    description: string;
    @Prop({required: true})
    releaseYear: number;
    @Prop({ trim: true})
    genre: string;
    @Prop({required:true})
    duration:number;
    @Prop({default:''})
    videoUrl: string;
}
export const MovieSchema = SchemaFactory.createForClass(Movie);