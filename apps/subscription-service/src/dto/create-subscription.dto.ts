import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PlanType } from '../schemas/subscription.schema';

export class CreateSubscriptionDto {
  @IsEnum(PlanType)
  plan: PlanType;

  @IsString()
  @IsOptional()
  movieId?: string;
}
