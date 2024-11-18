import { ApiProperty } from '@nestjs/swagger';
import { CartStatus } from '@prisma/client';
import { IsOptional } from 'class-validator';
export class CreateCartDto {
  cartStatus?: CartStatus;

  @ApiProperty({
    description: 'ID temporal del carrito',
    required: false
  })
  @IsOptional()
  tempId?: string;
}
