import { Body, Controller, Delete, Get, Param, Post, Patch, Query, UseGuards } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { JwtAuthGuard, RoleGuard, Roles, UserRole } from '@app/common';

@Controller('movies')
export class MovieController {
    constructor(private readonly moviesService: MoviesService) {}

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles(UserRole.Admin)
    @Post()
    create(@Body() createMovieDto: CreateMovieDto) {
        return this.moviesService.create(createMovieDto);
    }

    @Get()
    findAll(@Query() query: PaginationQueryDto) {
        return this.moviesService.findAll(query);
    }
    @Get(':id')
    findOne(@Param('id') id: string){
        return this.moviesService.findOne(id);
    }
    @UseGuards(JwtAuthGuard,RoleGuard)
    @Roles(UserRole.Admin)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateMovieDto: UpdateMovieDto,
    
    ){
        return this.moviesService.update(id, updateMovieDto);
    }
    @UseGuards(JwtAuthGuard,RoleGuard)
    @Roles(UserRole.Admin)
    @Delete(':id')
    remove(@Param('id') id: string){
        return this.moviesService.remove(id);
    }
}