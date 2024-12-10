import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetProductDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Café',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Precio máximo del producto',
    example: 10.5,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  priceMax?: number;

  @ApiProperty({
    description: 'Precio mínimo del producto',
    example: 5.5,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  priceMin?: number;

  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Café',
    required: false
  })
  @IsOptional()
  @IsString()
  categoryName?: string;
}
