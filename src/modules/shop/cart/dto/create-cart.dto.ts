import { ApiProperty } from '@nestjs/swagger';
import { CartStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
export class CreateCartDto {
  @ApiProperty({
    description: 'Estado del carrito',
    enum: CartStatus,
    default: CartStatus.PENDING,
    required: false
  })
  @IsOptional()
  @IsEnum(CartStatus)
  cartStatus?: CartStatus;
}
