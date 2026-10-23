import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MovieController } from './movies.controller';
import { MoviesService } from './movies.service';
import { Movie, MovieSchema } from './schemas/movie.schema';
@Module({
    imports:[
        MongooseModule.forFeature([{
            name:Movie.name,
            schema: MovieSchema
        }]),

    ],
    controllers:[MovieController],
    providers:[ MoviesService],
    exports: [MoviesService]
})
export class MoviesModule {}