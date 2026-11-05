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
  Query,
} from '@nestjs/common';
import { GrpcMethod, EventPattern, Payload } from '@nestjs/microservices';
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
  @Get('plans/all')
  getAllPlansAdmin() {
    return this.subscriptionServiceService.getAllPlansAdmin();
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
  deletePlan(@Param('id') id: string, @Query('hard') hard?: string) {
    const isHard = hard === 'true';
    return this.subscriptionServiceService.deletePlan(id, isHard);
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
  @EventPattern('payment.success')
  async handlePaymentSuccess(@Payload() data: any) {
    await this.subscriptionServiceService.activateFromPayment(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  subscribe(@Request() req: any, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionServiceService.createSubscription(
      req.user.userId,
      dto,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  cancelSubscription(@Request() req: any) {
    return this.subscriptionServiceService.cancelSubscription(req.user.userId);
  }
}
