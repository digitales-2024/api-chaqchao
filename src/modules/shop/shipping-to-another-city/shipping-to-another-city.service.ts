import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ShippingDetailsDto {
  @ApiProperty({ description: 'Estado del envío', required: false })
  @IsString()
  @IsOptional()
  shippingState?: string;

  @ApiProperty({ description: 'Ciudad del envío', required: false })
  @IsString()
  @IsOptional()
  shippingCity?: string;

  @ApiProperty({ description: 'Dirección del envío', required: false })
  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @ApiProperty({ description: 'Referencias adicionales del envío', required: false })
  @IsString()
  @IsOptional()
  shippingReferences?: string;
}

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  // Crear detalles de envío para un pedido
  async createShippingDetails(orderId: string, shippingDetails: ShippingDetailsDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        isShipping: true,
        shippingState: shippingDetails.shippingState,
        shippingCity: shippingDetails.shippingCity,
        shippingAddress: shippingDetails.shippingAddress,
        shippingReferences: shippingDetails.shippingReferences
      }
    });
  }

  // Obtener detalles de envío de un pedido
  async getShippingDetails(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return {
      shippingState: order.shippingState,
      shippingCity: order.shippingCity,
      shippingAddress: order.shippingAddress,
      shippingReferences: order.shippingReferences
    };
  }

  // Actualizar detalles de envío para un pedido
  async updateShippingDetails(orderId: string, shippingDetails: ShippingDetailsDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        isShipping: true,
        shippingState: shippingDetails.shippingState,
        shippingCity: shippingDetails.shippingCity,
        shippingAddress: shippingDetails.shippingAddress,
        shippingReferences: shippingDetails.shippingReferences
      }
    });
  }

  // Eliminar detalles de envío para un pedido
  async deleteShippingDetails(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        isShipping: false,
        shippingState: null,
        shippingCity: null,
        shippingAddress: null,
        shippingReferences: null
      }
    });
  }
}
