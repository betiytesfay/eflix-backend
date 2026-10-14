import { Body, Controller,Delete, Get, Param, Post, Patch, UseGuards} from '@nestjs/common';
import {MoviesService} from './movies.service';
import {CreateMovieDto} from './dto/create-movie.dto';
import {UpdateMovieDto} from './dto/update-movie.dto';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {RoleGuard} from '../auth/guards/role.guard';
import {Roles} from '../auth/decorators/role.decorator';
import {UserRole} from '../users/schemas/user.schema';

@Controller('movies')
export class MovieController{
    constructor(private readonly moviesService: MoviesService) {}
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles(UserRole.Admin)
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