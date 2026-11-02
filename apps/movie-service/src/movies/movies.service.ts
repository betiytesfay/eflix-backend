import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { Movie } from './schemas/movie.schema';
import { firstValueFrom, Observable } from 'rxjs';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { PaginatedResponse } from '@app/common';

interface SubscriptionRpcService {
  checkAccess(data: {
    userId?: string;
    movieId: string;
    ipAddress: string;
    guestDeviceId?: string;
  }): Observable<{
    hasAccess: boolean;
    planType: string;
    remainingFree: number;
    message: string;
  }>;
}

@Injectable()
export class MoviesService implements OnModuleInit {
  private subscriptionRpcService: SubscriptionRpcService;
  constructor(
    @InjectModel(Movie.name)
    private movieModel: Model<Movie>,

    @Inject('SUBSCRIPTION_PACKAGE')
    private client: ClientGrpc,

    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  onModuleInit() {
    this.subscriptionRpcService =
      this.client.getService<SubscriptionRpcService>('SubscriptionRpcService');
  }

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    const movie = await this.movieModel.create(createMovieDto);
    this.notificationClient.emit('movie.created', {
      id: movie._id.toString(),
      title: movie.title,
      genre: movie.genre,
      releaseYear: movie.releaseYear,
    });
    return movie;
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Movie>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.genre) {
      filter.genre = { $regex: query.genre, $options: 'i' };
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, totalItems] = await Promise.all([
      this.movieModel.find(filter).skip(skip).limit(limit).exec(),
      this.movieModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit) || 1,
        currentPage: page,
      },
    };
  }
  async findOne(id: string): Promise<Movie> {
    const movie = await this.movieModel.findById(id).exec();
    if (!movie) {
      throw new NotFoundException(`Movie with ID "${id}" not found`);
    }
    return movie;
  }
  async streamMovie(
    movieId: string,
    userId?: string,
    ipAddress = '',
    guestDeviceId = '',
  ) {
    const movie = await this.findOne(movieId);
    const accessCheck = await firstValueFrom(
      this.subscriptionRpcService.checkAccess({
        userId: userId || '',
        movieId,
        ipAddress,
        guestDeviceId,
      }),
    );
    if (!accessCheck.hasAccess) {
      throw new ForbiddenException(
        accessCheck.message === 'GUEST_LIMIT_REACHED'
          ? ' You have reached your limit of 10 free movies this month. Please create an account or subscribe!'
          : 'Active subscription required to watch this movie',
      );
    }
    return {
      message: 'Access granted. Enjoy your movie!',
      planType: accessCheck.planType,
      remainingFree: accessCheck.remainingFree,
      movie: {
        id: movie._id,
        title: movie.title,
        genre: movie.genre,
        streamUrl:
          (movie as any).videoUrl || 'https://streaming.eflic.com/demo.mp4',
      },
    };
  }
  async update(id: string, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    const updatedMovie = await this.movieModel
      .findByIdAndUpdate(id, updateMovieDto, { new: true })
      .exec();
    if (!updatedMovie) {
      throw new NotFoundException(`Movie with ID "${id}" not found`);
    }
    return updatedMovie;
  }
  async remove(id: string): Promise<{ message: string }> {
    const deletedMovie = await this.movieModel.findByIdAndDelete(id).exec();
    if (!deletedMovie) {
      throw new NotFoundException(`Movie with ID "${id}" not found`);
    }
    return { message: 'Movie deleted successfully' };
  }
}
