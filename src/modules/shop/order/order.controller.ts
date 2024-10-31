import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderInfo } from 'src/interfaces/order.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { ClientAuth } from '../auth/decorators/client-auth.decorator';
import { HttpResponse } from 'src/interfaces';
import { OrdersService } from 'src/modules/admin/orders/orders.service';

import { Response } from 'express';

@ApiTags('Order Shop')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad Request' })
@ClientAuth()
@Controller({
  path: 'order',
  version: '1'
})
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly ordersService: OrdersService
  ) {}
  @ApiOkResponse({ description: 'Order Created' })
  @Post()
  create(@Body() createOrderDto: CreateOrderDto): Promise<HttpResponse<OrderInfo>> {
    return this.orderService.create(createOrderDto);
  }

  @ApiOkResponse({ description: 'Get paid order information' })
  @Get('details/:id')
  async getOrderDetails(@Param('id') id: string) {
    return this.orderService.getOrderDetails(id);
  }

  @ApiBadRequestResponse({ description: 'Orders no found' })
  @ApiOkResponse({ description: 'Orders found' })
  @Get('client/:id')
  findByClient(@Param('id') id: string) {
    return this.ordersService.findByClient(id);
  }

  @ApiBadRequestResponse({ description: 'Order not found' })
  @ApiOkResponse({ description: 'Order exported as PDF' })
  @Post('export/pdf/:id')
  async exportPdf(
    @Res() res: Response,
    @Param('id') id: string,
    @Query('display') display?: string
  ) {
    const { code, pdfBuffer } = await this.ordersService.exportPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    // Decide whether to display inline or as attachment
    if (display === 'inline') {
      res.setHeader('Content-Disposition', `inline; filename="Pedido-${code}.pdf"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="Pedido-${code}.pdf"`);
    }
    res.send(pdfBuffer);
  }

  //EP el detail del que se loguea
  /*
  @ApiOkResponse({ description: 'Get all orders information by client' })
  @Get('orders/)
  async getOrderDetails(@GetClient() clientId: ClientData) {
  return this.orderService.getOrderDetails(clientId);
  }
  */
}
