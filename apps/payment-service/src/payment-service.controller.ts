import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@app/common';
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
}
