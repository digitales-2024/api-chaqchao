import { Controller, Get, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Auth } from '../auth/decorators';

@Controller({
  path: 'orders',
  version: '1'
})
@Auth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query('date') date: string) {
    return this.ordersService.findAll(date);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }
}
