import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, required: false })
  images?: any[];

  @ApiProperty({
    description: 'IDs de las imágenes a eliminar',
    type: 'array',
    items: { type: 'string' },
    required: false,
    example: ['123e4567-e89b-12d3-a456-426614174000']
  })
  @IsArray()
  @IsOptional()
  deleteImages?: string[];

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Café Latte',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name?: string;

  @ApiProperty({
    description: 'Descripción del producto',
    example: 'Café con leche',
    required: false
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;

  @ApiProperty({
    description: 'Precio del producto',
    example: 10.5,
    required: false
  })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  price?: number;

  @ApiProperty({
    description: 'Stock máximo del producto',
    example: 10,
    required: false
  })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  maxStock?: number;

  @ApiProperty({
    description: '¿El producto está restringido?',
    example: false,
    required: false
  })
  @IsUUID()
  categoryId?: string;
}
