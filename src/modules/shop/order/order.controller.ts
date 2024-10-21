import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderInfo } from 'src/interfaces/order.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { ClientAuth } from '../auth/decorators/client-auth.decorator';
import { HttpResponse } from 'src/interfaces';

@ApiTags('Order')
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

  //EP el detail del que se loguea
  /*
  @ApiOkResponse({ description: 'Get all orders information by client' })
  @Get('orders/)
  async getOrderDetails(@GetClient() clientId: ClientData) {
    return this.orderService.getOrderDetails(clientId);
  }
    */
}
