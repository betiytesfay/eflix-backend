import { IsNotEmpty, IsString, MinLength } from 'class-validator';
export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
