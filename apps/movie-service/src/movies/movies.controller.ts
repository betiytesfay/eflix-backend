import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Ip,
  Post,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
  RoleGuard,
  Roles,
  UserRole,
} from '@app/common';

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
  @UseGuards(JwtAuthGuard)
  @Get('my/favorites')
  getMyFavorites(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.moviesService.getMyFavorites(
      req.user.userId,
      Number(page),
      Number(limit),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  toggleFavorite(@Param('id') id: string, @Req() req: any) {
    return this.moviesService.toggleFavorite(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/is-favorite')
  checkIsFavorite(@Param('id') id: string, @Req() req: any) {
    return this.moviesService.checkIsFavorite(req.user.userId, id);
  }
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/play')
  streamMovie(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('x-device-id') deviceId?: string,
  ) {
    const userId = req.user?.userId;
    return this.moviesService.streamMovie(id, userId, ip, deviceId);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moviesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Admin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMovieDto: UpdateMovieDto) {
    return this.moviesService.update(id, updateMovieDto);
  }
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.moviesService.remove(id);
  }
}
