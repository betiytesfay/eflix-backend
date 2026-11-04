import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { JwtAuthGuard, RoleGuard, Roles, UserRole } from '@app/common';
import {
  SubscriptionServiceService,
  CheckAccessRequest,
  CheckAccessResponse,
} from './subscription-service.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('subscriptions')
export class SubscriptionServiceController {
  constructor(
    private readonly subscriptionServiceService: SubscriptionServiceService,
  ) {}

  @GrpcMethod('SubscriptionRpcService', 'CheckAccess')
  async checkAccess(data: CheckAccessRequest): Promise<CheckAccessResponse> {
    return this.subscriptionServiceService.checkAccess(data);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Admin)
  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionServiceService.createPlan(dto);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Admin)
  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: Partial<CreatePlanDto>) {
    return this.subscriptionServiceService.updatePlan(id, dto);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Admin)
  @Delete('plans/:id')
  deletePlan(@Param('id') id: string) {
    return this.subscriptionServiceService.deletePlan(id);
  }

  @Get('plans')
  getPlans() {
    return this.subscriptionServiceService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMySubscription(@Request() req: any) {
    return this.subscriptionServiceService.getMySubscription(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  subscribe(@Request() req: any, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionServiceService.createSubscription(
      req.user.userId,
      dto,
    );
  }
}
