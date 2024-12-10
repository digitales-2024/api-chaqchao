import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsNumber } from 'class-validator';

export class CreateCartItemDto {
  @ApiProperty({
    description: 'Identificador del carrito de compras',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  cartId: string;

  @ApiProperty({
    description: 'Identificador del producto',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Cantidad del producto',
    example: 1
  })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
