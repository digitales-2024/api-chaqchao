import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
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
}
