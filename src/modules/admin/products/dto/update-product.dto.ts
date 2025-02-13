import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { UpdateProductVariationDto } from '../../product-variation/dto/update-product-variation.dto';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
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
  price?: number;

  @ApiProperty({
    description: '¿El producto está restringido?',
    example: false,
    required: false
  })
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    description: 'Variaciones del producto a actualizar',
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Variación 1',
        price: 10.5
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Variación 2',
        price: 15.5
      }
    ]
  })
  @IsArray()
  variationsUpdate?: UpdateProductVariationDto[];
}
