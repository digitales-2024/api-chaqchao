import { ApiProperty } from '@nestjs/swagger';
import { CartStatus } from '@prisma/client';
import { IsOptional, IsUUID } from 'class-validator';
export class CreateCartDto {
  cartStatus?: CartStatus;

  @ApiProperty({
    description: 'ID temporal del carrito',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  @IsOptional()
  @IsUUID()
  tempId?: string;

  @ApiProperty({
    description: 'ID del cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
