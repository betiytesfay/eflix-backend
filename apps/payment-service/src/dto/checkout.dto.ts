import { IsEnum, IsOptional, IsString } from 'class-validator';
export enum PaymentMethod {
  TELEBIRR = 'TELEBIRR',
  CHAPA = 'CHAPA',
}
export class CheckoutDto {
  @IsString()
  planId: string;
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
  @IsString()
  @IsOptional()
  movieId?: string;
}
