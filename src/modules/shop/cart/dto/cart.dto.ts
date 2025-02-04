import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class CartDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    description: 'IDs de los productos en el carrito'
  })
  @IsArray()
  cartItems: string[];
}
