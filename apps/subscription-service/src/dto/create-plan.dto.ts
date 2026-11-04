import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PlanType } from '../schemas/subscription.schema';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsEnum(PlanType)
  type: PlanType;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @Min(1)
  durationDays: number;

  @IsString()
  description: string;
}
