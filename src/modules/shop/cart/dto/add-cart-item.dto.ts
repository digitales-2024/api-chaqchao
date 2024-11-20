import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    description: 'ID del producto para agregar al carrito',
    type: String,
    format: 'uuid'
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Cantidad de producto para agregar al carrito',
    type: Number,
    default: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({
    description: 'ID del cliente para agregar al carrito',
    type: String,
    required: false
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
