import { Injectable, NotFoundException } from "@nestjs/common";
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {Movie} from './schemas/movie.schema';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { PaginatedResponse } from '@app/common';

@Injectable()
export class MoviesService {
    constructor(
        @InjectModel(Movie.name)
        private movieModel: Model<Movie>,
    ) {}

    async create(createMovieDto: CreateMovieDto): Promise<Movie> {
        return this.movieModel.create(createMovieDto);
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
    async findOne(id: string): Promise<Movie>{
        const movie = await this.movieModel.findById(id).exec();
        if(!movie){
            throw new NotFoundException(`Movie with ID "${id}" not found`);
        }
        return movie;
    }
    async update(id: string, updateMovieDto: UpdateMovieDto): Promise<Movie>{
        const updatedMovie= await this.movieModel.findByIdAndUpdate(id,updateMovieDto, {new: true}).exec();
        if(!updatedMovie){
            throw new NotFoundException(`Movie with ID "${id}" not found`)
        }
        return updatedMovie;
    }
    async remove(id: string): Promise<{message: string}>{
        const deletedMovie = await this.movieModel.findByIdAndDelete(id).exec();
        if(!deletedMovie){
            throw new NotFoundException(`Movie with ID "${id}" not found`);
        }
        return {message:"Movie deleted successfully"}
    }

}
 