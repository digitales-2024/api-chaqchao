import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Controller, Get, Param, Post, Res } from '@nestjs/common';
import { OrderService } from './order.service';
import { ClientAuth } from '../auth/decorators/client-auth.decorator';
import { ClientPayload } from 'src/interfaces';
import { GetClient } from '../auth/decorators/get-client.decorator';
import { Response } from 'express';

@ApiTags('Shop Order')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad Request' })
@ClientAuth()
@Controller({
  path: 'order',
  version: '1'
})
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Mostrar detalle de una orden de un usuario.
   */
  @Get('details/:id')
  @ApiOkResponse({ description: 'Get paid order information' })
  @ClientAuth()
  async getOrderDetails(@Param('id') id: string) {
    return this.orderService.getOrderDetails(id);
  }

  /**
   * Recupera los pedidos para una cliente.
   */
  @Get('/orders')
  @ApiOkResponse({ description: 'Orders client' })
  @ClientAuth()
  async getOrders(@GetClient() client: ClientPayload) {
    return await this.orderService.getOrders(client.id);
  }

  /**
   * Exportar un pedido en formato PDF
   */
  @Post('export/pdf/:id')
  @ClientAuth()
  async exportPdf(@Res() res: Response, @Param('id') id: string) {
    const { code, pdfBuffer } = await this.orderService.exportPdfOrder(id);
    // Enviar el archivo PDF en la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Pedido-${code}.pdf"`);
    res.send(pdfBuffer);
  }
}
