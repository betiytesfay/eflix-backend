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
import { Favorite } from './schemas/favorite.schema';
import { WatchProgress } from './schemas/watch-progress.schema';
import { SaveProgressDto } from './dto/save-progress.dto';

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

    @InjectModel(WatchProgress.name)
    private readonly watchProgressModel: Model<WatchProgress>,

    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<Favorite>,

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
  async toggleFavorite(userId: string, movieId: string) {
    await this.findOne(movieId);

    const existing = await this.favoriteModel.findOne({
      userId,
      movie: movieId,
    });

    if (existing) {
      await this.favoriteModel.findByIdAndDelete(existing._id);
      return { isFavorite: false, message: 'Removed from favorites' };
    }

    await this.favoriteModel.create({ userId, movie: movieId });
    return { isFavorite: true, message: 'Added to favorites' };
  }

  async getMyFavorites(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [favorites, totalItems] = await Promise.all([
      this.favoriteModel
        .find({ userId })
        .populate('movie')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.favoriteModel.countDocuments({ userId }),
    ]);

    const movies = favorites
      .map((fav) => fav.movie)
      .filter((movie) => movie !== null);

    return {
      data: movies,
      meta: {
        totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit) || 1,
      },
    };
  }

  async checkIsFavorite(userId: string, movieId: string) {
    const favorite = await this.favoriteModel.findOne({
      userId,
      movie: movieId,
    });
    return { isFavorite: !!favorite };
  }
  async saveProgress(userId: string, movieId: string, dto: SaveProgressDto) {
    await this.findOne(movieId);

    const isCompleted = dto.progressSeconds / dto.durationSeconds >= 0.9;

    const progress = await this.watchProgressModel.findOneAndUpdate(
      { userId, movie: movieId },
      {
        $set: {
          progressSeconds: dto.progressSeconds,
          durationSeconds: dto.durationSeconds,
          isCompleted,
        },
      },
      { upsert: true, new: true },
    );

    return {
      message: 'Watch progress saved',
      progress: {
        movieId,
        progressSeconds: progress.progressSeconds,
        durationSeconds: progress.durationSeconds,
        isCompleted: progress.isCompleted,
      },
    };
  }

  async getContinueWatching(userId: string, limit = 10) {
    const list = await this.watchProgressModel
      .find({ userId, isCompleted: false })
      .populate('movie')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();

    return list
      .filter((item) => item.movie !== null)
      .map((item) => ({
        movie: item.movie,
        progressSeconds: item.progressSeconds,
        durationSeconds: item.durationSeconds,
        percentage: Math.round(
          (item.progressSeconds / item.durationSeconds) * 100,
        ),
      }));
  }

  async getProgress(userId: string, movieId: string) {
    const record = await this.watchProgressModel.findOne({
      userId,
      movie: movieId,
    });
    if (!record) {
      return { progressSeconds: 0, durationSeconds: 0, isCompleted: false };
    }
    return {
      progressSeconds: record.progressSeconds,
      durationSeconds: record.durationSeconds,
      isCompleted: record.isCompleted,
    };
  }
  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Movie>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.genre) {
      filter.genre = { $regex: query.genre, $options: 'i' };
    }

    if (query.isFeatured !== undefined) {
      filter.isFeatured = query.isFeatured;
    }

    if (query.isTrending !== undefined) {
      filter.isTrending = query.isTrending;
    }

    if (query.accessType) {
      filter.accessType = query.accessType;
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
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
        streamUrl: this.formatEmbedUrl(movie.videoUrl),
      },
    };
  }

  private formatEmbedUrl(url?: string): string {
    if (!url) return '';
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
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
