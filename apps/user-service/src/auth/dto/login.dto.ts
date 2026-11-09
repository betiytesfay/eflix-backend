import { IsNotEmpty, IsString, IsOptional, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  identifier?: string;

  @IsString()
  @MinLength(6)
  password: string;
}
