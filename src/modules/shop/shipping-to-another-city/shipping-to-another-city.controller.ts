import { Controller, Post, Get, Patch, Delete, Param, Body } from '@nestjs/common';
import { ShippingDetailsDto, ShippingService } from './shipping-to-another-city.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Shop Order')
@Controller('order')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  // Crear detalles de envío para un pedido
  @Post(':id/shipping')
  @ApiOperation({ summary: 'Crear detalles de envío para un pedido' })
  @ApiResponse({ status: 201, description: 'Detalles de envío creados correctamente' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiBody({ description: 'Detalles de envío para el pedido', type: ShippingDetailsDto })
  async createShipping(@Param('id') orderId: string, @Body() shippingDetails: ShippingDetailsDto) {
    const createdShippingDetails = await this.shippingService.createShippingDetails(
      orderId,
      shippingDetails
    );
    return { message: 'Detalles de envío creados correctamente', createdShippingDetails };
  }

  // Obtener detalles de envío de un pedido
  @Get(':id/shipping')
  @ApiOperation({ summary: 'Obtener detalles de envío de un pedido' })
  @ApiResponse({ status: 200, description: 'Detalles de envío obtenidos correctamente' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async getShipping(@Param('id') orderId: string) {
    const shippingDetails = await this.shippingService.getShippingDetails(orderId);
    return { message: 'Detalles de envío obtenidos correctamente', shippingDetails };
  }

  // Actualizar detalles de envío para un pedido
  @Patch(':id/shipping')
  @ApiOperation({ summary: 'Actualizar detalles de envío para un pedido' })
  @ApiResponse({ status: 200, description: 'Detalles de envío actualizados correctamente' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiBody({ description: 'Detalles de envío para actualizar', type: ShippingDetailsDto })
  async updateShipping(@Param('id') orderId: string, @Body() shippingDetails: ShippingDetailsDto) {
    const updatedShippingDetails = await this.shippingService.updateShippingDetails(
      orderId,
      shippingDetails
    );
    return { message: 'Detalles de envío actualizados correctamente', updatedShippingDetails };
  }

  // Eliminar detalles de envío de un pedido
  @Delete(':id/shipping')
  @ApiOperation({ summary: 'Eliminar detalles de envío de un pedido' })
  @ApiResponse({ status: 200, description: 'Detalles de envío eliminados correctamente' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async deleteShipping(@Param('id') orderId: string) {
    const deletedShippingDetails = await this.shippingService.deleteShippingDetails(orderId);
    return { message: 'Detalles de envío eliminados correctamente', deletedShippingDetails };
  }
}
