import { ApiProperty } from '@nestjs/swagger';
import { CartStatus } from '@prisma/client';
import { IsOptional, IsUUID } from 'class-validator';
export class CreateCartDto {
  cartStatus?: CartStatus;

  @ApiProperty({
    description: 'ID temporal del carrito',
    required: false
  })
  @IsOptional()
  @IsUUID()
  tempId?: string;

  @ApiProperty({
    description: 'ID del cliente',
    required: false
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
