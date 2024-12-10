import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProductVariationDto } from './create-product-variation.dto';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProductVariationDto extends PartialType(CreateProductVariationDto) {
  @ApiProperty({
    description: 'Nombre de la variación',
    example: 'Tamaño',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name?: string;

  @ApiProperty({
    description: 'Descripción de la variación',
    example: 'Tamaño del producto',
    required: false
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;

  @ApiProperty({
    description: 'Precio adicional de la variación',
    example: 10.5,
    required: false
  })
  @IsNumber()
  additionalPrice?: number;

  @ApiProperty({
    description: 'ID del producto al que pertenece la variación',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  @IsUUID()
  productId?: string;
}
