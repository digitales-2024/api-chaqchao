import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsArray, IsNotEmpty, IsNumber, IsString, IsUrl, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { UpdateProductVariationDto } from '../../product-variation/dto/update-product-variation.dto';

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
    description: 'Descripción del producto',
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
    description: 'Imagen del producto',
    example: 'https://www.example.com/image.jpg',
    required: false
  })
  @IsString()
  @IsUrl()
  image?: string;

  @ApiProperty({
    description: '¿El producto está restringido?',
    example: false,
    required: false
  })
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    description: 'Variaciones del producto',
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
