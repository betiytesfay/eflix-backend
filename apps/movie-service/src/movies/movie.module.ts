import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { RmqModule } from '@app/common';
import { MovieController } from './movies.controller';
import { MoviesService } from './movies.service';
import { Movie, MovieSchema } from './schemas/movie.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Movie.name,
        schema: MovieSchema,
      },
    ]),
    RmqModule.register({ name: 'NOTIFICATION_SERVICE'}),
    ClientsModule.register([
      {
        name: 'SUBSCRIPTION_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'subscription',
          protoPath: join(
            __dirname,
            '../../../../libs/common/src/proto/subscription.proto',
          ),
          url: process.env.SUBSCRIPTION_GRPC_URL || 'localhost:50051',
        },
      },
    ]),
  ],
  controllers: [MovieController],
  providers: [MoviesService],
  exports: [MoviesService],
})
export class MoviesModule {}
