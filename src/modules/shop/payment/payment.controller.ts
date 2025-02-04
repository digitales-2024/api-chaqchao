import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Res,
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Response } from 'express';

import { ApiExcludeController } from '@nestjs/swagger';
@ApiExcludeController()
@Controller({
  path: 'payment',
  version: '1'
})
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Crear un pago
   * @param createPaymentDto Datos del pago
   * @param res Objeto de respuesta de Express
   * @returns Promesa con el formToken del pago o lanza una excepción
   */
  @Post()
  async createPayment(@Body() createPaymentDto: CreatePaymentDto, @Res() res: Response) {
    try {
      const formToken = await this.paymentService.createPayment(createPaymentDto);
      res.status(HttpStatus.OK).send({ token: formToken });
    } catch (error) {
      // Si el error ya es una excepción de NestJS, simplemente re-lanzarla
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        res.status(error.getStatus()).send(error.message);
      } else {
        // Para otros errores, enviar un error genérico
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Internal server error');
      }
    }
  }

  /**
   * Válida los datos de pago dados (hash)
   */
  @Post('validate')
  async validatePayment(@Body() body, @Res() res: Response) {
    try {
      const isValid = this.paymentService.validatePayment(body);
      res.status(HttpStatus.OK).send({ isValid });
    } catch (error) {
      // Si el error ya es una excepción de NestJS, simplemente re-lanzarla
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        res.status(error.getStatus()).send(error.message);
      } else {
        // Para otros errores, enviar un error genérico
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Internal server error');
      }
    }
  }
}
