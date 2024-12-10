import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
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
   * Obtenga información de pedido pagado
   * @param id Identificador del orden
   * @returns Detalles del pedido
   */
  @Get('details/:id')
  @ApiOperation({ summary: 'Obtenga información de pedido pagado' })
  @ApiOkResponse({ description: 'Obtenga información de pedido pagado' })
  @ApiParam({ name: 'id', description: 'Identificador del orden', example: '1' })
  @ClientAuth()
  async getOrderDetails(@Param('id') id: string) {
    return this.orderService.getOrderDetails(id);
  }

  /**
   * Obtenga todos los pedidos para una cliente.
   * @param client Cliente para obtener pedidos para
   * @returns Órdenes de la clienta
   */
  @Get('/orders')
  @ApiOperation({ summary: 'Obtenga todos los pedidos para una cliente' })
  @ApiOkResponse({ description: 'Pedido del Cliente' })
  @ClientAuth()
  async getOrders(@GetClient() client: ClientPayload) {
    return await this.orderService.getOrders(client.id);
  }

  /**
   * Exportar un pedido en formato PDF
   * @param id  ID del pedido
   * @returns  Archivo PDF
   */
  @Post('export/pdf/:id')
  @ApiOperation({ summary: 'Exportar un pedido en formato PDF' })
  @ApiOkResponse({ description: 'Archivo PDF' })
  @ApiParam({ name: 'id', description: 'Identificador del pedido', example: '1' })
  @ClientAuth()
  async exportPdf(@Res() res: Response, @Param('id') id: string) {
    const { code, pdfBuffer } = await this.orderService.exportPdfOrder(id);
    // Enviar el archivo PDF en la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Pedido-${code}.pdf"`);
    res.send(pdfBuffer);
  }
}
