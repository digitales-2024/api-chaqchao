import { Controller, Post, Body, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller({ path: 'paypal-payment', version: '1' })
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Crear una orden de PayPal
   */
  @Post('create-order')
  async createOrder(@Body() createOrderDto: { total: number; currency: string }) {
    const order = await this.paymentService.createPayPalOrder(
      createOrderDto.total,
      createOrderDto.currency
    );
    return order;
  }

  /**
   * Capturar una orden de PayPal
   */
  @Post('capture-order/:orderId')
  async captureOrder(@Param('orderId') orderId: string) {
    try {
      const captureData = await this.paymentService.capturePayPalOrder(orderId);
      await this.paymentService.savePaymentDetails(orderId, captureData);
      return captureData;
    } catch (error) {
      throw error;
    }
  }
}
