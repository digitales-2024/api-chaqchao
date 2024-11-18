// src/payment/payment.controller.ts
import { Controller, Post, Body, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { GenerateTokenDto } from './dto/generate-token.dto';

@Controller({
  path: 'payment',
  version: '1'
})
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Endpoint para generar un token de Izipay
   * POST /token
   */
  @Post(':transactionId')
  async generateToken(
    @Param('transactionId') transactionId: string,
    @Body() generateTokenDto: GenerateTokenDto
  ) {
    try {
      const tokenResponse = await this.paymentService.generateToken(
        transactionId,
        generateTokenDto
      );
      return tokenResponse;
    } catch (error) {
      throw error; // El servicio ya maneja las excepciones
    }
  }
}
