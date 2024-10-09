import { Body, Controller, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Auth } from '../auth/decorators';
import { OrderStatus } from '@prisma/client';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Orders')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@Controller({
  path: 'orders',
  version: '1'
})
@Auth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiBadRequestResponse({ description: 'Orders no found' })
  @ApiOkResponse({ description: 'Orders found' })
  @Get()
  findAll(@Query('date') date: string, @Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(date, status);
  }

  @ApiBadRequestResponse({ description: 'Order no found' })
  @ApiOkResponse({ description: 'Order found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @ApiBadRequestResponse({ description: 'Order status not updated' })
  @ApiOkResponse({ description: 'Order status updated' })
  @Patch(':id')
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.updateStatus(id, status);
  }

  @ApiBadRequestResponse({ description: 'Orders no found' })
  @ApiOkResponse({ description: 'Orders found' })
  @Get('client/:id')
  findByClient(@Param('id') id: string) {
    return this.ordersService.findByClient(id);
  }

  @Post('export/pdf/:id')
  async exportPdf(@Res() res: Response, @Param('id') id: string) {
    const { code, pdfBuffer } = await this.ordersService.exportPdf(id);
    // Enviar el archivo PDF en la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Pedido-${code}.pdf"`);
    res.send(pdfBuffer);
  }
}
