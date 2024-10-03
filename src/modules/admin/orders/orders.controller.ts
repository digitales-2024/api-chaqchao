import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Auth } from '../auth/decorators';
import { OrderStatus } from '@prisma/client';

@Controller({
  path: 'orders',
  version: '1'
})
@Auth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // TODO Documentar API
  @Get()
  findAll(@Query('date') date: string, @Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(date, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.updateStatus(id, status);
  }
}
