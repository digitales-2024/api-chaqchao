import { Body, Controller, Headers, Post, Req, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Request, Response } from 'express';
import { ApiBadRequestResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'UnAuthorized' })
@ApiTags('Payments')
@Controller({
  path: 'payment',
  version: '1'
})
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/sdktest')
  async postSDKTest(@Req() req: Request, @Res() res: Response) {
    const result = await this.paymentService.postSDKTest(req.body);
    return res.json(result);
  }

  @Post('/create-payment')
  async postCreatePayment(@Req() req: Request, @Res() res: Response) {
    const result = await this.paymentService.postCreatePayment(req.body);
    return res.json(result);
  }

  @Post('/create-token')
  async postCreateToken(@Req() req: Request, @Res() res: Response) {
    const result = await this.paymentService.postCreateToken(req.body);
    return res.json(result);
  }

  @Post('create-session-token')
  async createSessionToken(
    @Headers('transactionId') transactionId: string, // transactionId enviado en los headers
    @Body() body: any // El resto de los parámetros vienen en el cuerpo de la solicitud
  ) {
    const { merchantCode, orderNumber, publicKey, amount } = body;

    // Llamar al servicio de pago y pasar los parámetros
    return await this.paymentService.createSessionToken(transactionId, {
      requestSource: 'ECOMMERCE', // Default value
      merchantCode,
      orderNumber,
      publicKey,
      amount
    });
  }

  @Post('validate-account')
  async validateAccount(
    @Headers('transactionId') transactionId: string,
    @Headers('Authorization') token: string,
    @Body() accountData: any
  ) {
    // Llamar al servicio de pago para validar la cuenta
    return await this.paymentService.validateAccount(transactionId, token, accountData);
  }
}
