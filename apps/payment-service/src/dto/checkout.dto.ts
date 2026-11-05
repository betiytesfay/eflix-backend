import {
  IsEnum,
  IsNumber,
  Min,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';
export enum PaymentMethod {
  TELEBIRR = 'TELEBIRR',
  CHAPA = 'CHAPA',
}
export class CheckoutDto {
  @IsString()
  planId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod = PaymentMethod.CHAPA;

  @IsString()
  @IsOptional()
  movieId?: string;
}
