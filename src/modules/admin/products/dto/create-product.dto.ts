import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID
} from 'class-validator';
import { CreateProductVariationDto } from '../../product-variation/dto/create-product-variation.dto';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Café Latte'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

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
    example: 10.5
  })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Imagen del producto',
    example: 'https://www.example.com/image.jpg'
  })
  @IsString()
  @IsUrl()
  image: string;

  @ApiProperty({
    description: '¿El producto está restringido?',
    example: false
  })
  @IsOptional()
  isRestricted?: boolean;

  @ApiProperty({
    description: 'ID de la categoría a la que pertenece el producto',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    description: 'Variaciones del producto',
    type: [CreateProductVariationDto]
  })
  @IsArray()
  variations: CreateProductVariationDto[];
}
