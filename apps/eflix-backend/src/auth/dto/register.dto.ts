import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

// 🧠 WHY A DTO CLASS?
// DTO = Data Transfer Object.
// It describes the SHAPE of an incoming request body.
//
// In Express you had isUserRegistration() — a manual function that
// checked types one by one. If you forgot a field, the check silently passed.
//
// Here the class-validator decorators (@IsString, @MinLength, etc.)
// do the same job BUT:
//   1. Validation is automatic — no manual if() checks
//   2. Error messages are auto-generated and detailed
//   3. TypeScript knows the exact shape — fully typed
//
// NestJS's ValidationPipe (set in main.ts) reads these decorators
// on every incoming request and rejects with 400 if they fail.

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telegramAccount?: string;
}
