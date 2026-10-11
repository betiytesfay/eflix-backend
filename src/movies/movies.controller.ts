import { Body, Controller,Delete, Get, Param, Post, Patch, UseGuards} from '@nestjs/common';
import {MoviesService} from './movies.service';
import {CreateMovieDto} from './dto/create-movie.dto';
import {UpdateMovieDto} from './dto/update-movie.dto';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';

@Controller('movies')
export class MovieController{
    constructor(private readonly moviesService: MoviesService) {}
    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createMovieDto: CreateMovieDto){
        return this.moviesService.create(createMovieDto);
    }
    @Get()
    findAll(){
        return this.moviesService.findAll();
    }
    @Get(':id')
    findOne(@Param('id') id: string){
        return this.moviesService.findOne(id);
    }
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateMovieDto: UpdateMovieDto,
    
    ){
        return this.moviesService.update(id, updateMovieDto);
    }
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string){
        return this.moviesService.remove(id);
    }
}