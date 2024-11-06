import { Controller, Post, Body, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('paypal-payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  async createOrder(@Body() createOrderDto: { total: number; currency: string }) {
    const order = await this.paymentService.createPayPalOrder(
      createOrderDto.total,
      createOrderDto.currency
    );
    return order;
  }

  @Post('capture-order/:orderId')
  async captureOrder(@Param('orderId') orderId: string) {
    try {
      const captureData = await this.paymentService.capturePayPalOrder(orderId);
      await this.paymentService.savePaymentDetails(orderId, captureData);
      return captureData;
    } catch (error) {
      console.log('Error capturing PayPal order:', error);
      throw error;
    }
  }
}
