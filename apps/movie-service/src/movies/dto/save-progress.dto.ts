import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class SaveProgressDto {
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  progressSeconds: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  durationSeconds: number;
}
