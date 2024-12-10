import { Body, Controller, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Auth } from '../auth/decorators';
import { OrderStatus } from '@prisma/client';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Admin Orders')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@Controller({
  path: 'orders',
  version: '1'
})
@Auth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Recuperar todos los pedidos para la fecha dada y el estado opcional
   * @param date Fecha en formato ISO (aaa yyy-mm-dd)
   * @param status Estado opcional de los pedidos para recuperar
   * @returns Gama de pedidos
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todos los pedidos' })
  @ApiOkResponse({ description: 'Pedidos obtenidos' })
  @ApiQuery({ name: 'date', required: true, description: 'Fecha en formato ISO (aaa yyy-mm-dd)' })
  @ApiQuery({ name: 'status', required: false, description: 'Estado de los pedidos' })
  @ApiBadRequestResponse({ description: 'Error al obtener los pedidos' })
  findAll(@Query('date') date: string, @Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(date, status);
  }

  /**
   * Recuperar la informaci n de un pedido
   * @param id Identificador del pedido
   * @returns Informaci n del pedido
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pedido' })
  @ApiOkResponse({ description: 'Pedido obtenido' })
  @ApiBadRequestResponse({ description: 'Error al obtener el pedido' })
  @ApiParam({ name: 'id', required: true, description: 'Identificador del pedido' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  /**
   * Actualiza el estado de un pedido
   * @param id Identificador del pedido
   * @param status Nuevo estado del pedido
   * @returns Pedido actualizado
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar el estado de un pedido' })
  @ApiOkResponse({ description: 'Pedido actualizado' })
  @ApiBadRequestResponse({ description: 'Error al actualizar el pedido' })
  @ApiParam({ name: 'id', required: true, description: 'Identificador del pedido' })
  @ApiBody({
    description: 'Nuevo estado del pedido',
    required: true,
    enum: OrderStatus,
    examples: {
      status: {
        value: OrderStatus.PENDING
      }
    }
  })
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.updateStatus(id, status);
  }

  /**
   * Recuperar los pedidos de un cliente
   * @param id Identificador del cliente
   * @returns Pedidos del cliente
   */
  @Get('client/:id')
  @ApiOperation({ summary: 'Obtener los pedidos de un cliente' })
  @ApiOkResponse({ description: 'Pedidos del cliente' })
  @ApiBadRequestResponse({ description: 'Error al obtener los pedidos del cliente' })
  @ApiParam({ name: 'id', required: true, description: 'Identificador del cliente' })
  findByClient(@Param('id') id: string) {
    return this.ordersService.findByClient(id);
  }

  /**
   * Exportar un pedido en formato PDF
   * @param id Identificador del pedido
   * @returns Archivo PDF con el pedido
   */
  @Post('export/pdf/:id')
  @ApiOperation({ summary: 'Exportar un pedido en formato PDF' })
  @ApiOkResponse({ description: 'Archivo PDF con el pedido' })
  @ApiBadRequestResponse({ description: 'Error al exportar el pedido en formato PDF' })
  @ApiParam({ name: 'id', required: true, description: 'Identificador del pedido' })
  async exportPdf(@Res() res: Response, @Param('id') id: string) {
    const { code, pdfBuffer } = await this.ordersService.exportPdf(id);
    // Enviar el archivo PDF en la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Pedido-${code}.pdf"`);
    res.send(pdfBuffer);
  }
}
