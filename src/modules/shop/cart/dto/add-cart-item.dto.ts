import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    description: 'ID del producto para agregar al carrito',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Cantidad de producto para agregar al carrito',
    type: Number,
    default: 1,
    required: false,
    example: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({
    description: 'ID del cliente para agregar al carrito',
    type: String,
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
