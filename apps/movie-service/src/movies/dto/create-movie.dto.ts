import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { MovieAccessType } from '../schemas/movie.schema';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1888)
  releaseYear: number;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsInt()
  @IsPositive()
  duration: number;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  posterUrl?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isTrending?: boolean;

  @IsOptional()
  @IsEnum(MovieAccessType)
  accessType?: MovieAccessType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ppvPrice?: number;
}
