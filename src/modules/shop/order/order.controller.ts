import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderData } from 'src/interfaces/order.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { HttpResponse } from 'src/interfaces';
import { Auth } from 'src/modules/admin/auth/decorators';

@ApiTags('Order')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad Request' })
@Auth()
@Controller({
  path: 'order',
  version: '1'
})
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiOkResponse({ description: 'Get all orders' })
  @Get()
  findAll(): Promise<OrderData[]> {
    return this.orderService.findAll();
  }

  @ApiOkResponse({ description: 'Order Created' })
  @Post()
  create(@Body() createOrderDto: CreateOrderDto): Promise<HttpResponse<OrderData>> {
    return this.orderService.create(createOrderDto);
  }
}