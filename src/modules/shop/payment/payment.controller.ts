import { Controller, Post, Req, Res, Headers, HttpException, HttpStatus } from '@nestjs/common';
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

  @Post('/token')
  async generateToken(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('transactionId') transactionId: string
  ) {
    try {
      // Validar si todos los campos están presentes
      const { requestSource, merchantCode, orderNumber, publicKey, amount } = req.body;

      if (!requestSource || !merchantCode || !orderNumber || !publicKey || !amount) {
        throw new HttpException('Missing fields in the body', HttpStatus.BAD_REQUEST);
      }

      const result = await this.paymentService.getTokenSession(req.body, transactionId);
      return res.json(result);
    } catch (error) {
      throw new HttpException('Error generating token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
