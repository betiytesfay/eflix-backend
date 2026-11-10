import {
  Body,
  Controller,
  Get,
  Query,
  Post,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard, RoleGuard, Roles, UserRole } from '@app/common';
import { PaymentServiceService } from './payment-service.service';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('payments')
export class PaymentServiceController {
  constructor(private readonly paymentServiceService: PaymentServiceService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  checkout(@Request() req: any, @Body() dto: CheckoutDto) {
    return this.paymentServiceService.checkout(req.user.userId, dto);
  }
  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyTransactions(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.paymentServiceService.getMyTransactions(
      req.user.userId,
      Number(page),
      Number(limit),
    );
  }
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Admin)
  @Get()
  getAllTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
  ) {
    return this.paymentServiceService.getAllTransactions(
      Number(page),
      Number(limit),
      status,
    );
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() data: any) {
    return this.paymentServiceService.handleWebhook(data);
  }
}
