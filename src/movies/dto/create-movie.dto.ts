import { IsInt, IsNotEmpty , IsOptional, IsPositive, IsString, IsUrl, Min,} from 'class-validator';
export class CreateMovieDto{
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsInt()
    @Min(1888)
    releaseYear: number;

    @IsInt()
    @IsPositive()
    duration: number;

    @IsOptional()
    @IsString()
    videoUrl?: string;


}