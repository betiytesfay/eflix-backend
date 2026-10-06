import { IsNotEmpty, IsString, MinLength } from 'class-validator';

// 🧠 Same concept as RegisterDto — replaces isUserLogin() from Express.
// Only phoneNumber and password are required for login.
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @MinLength(6)
  password: string;
}
