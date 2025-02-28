import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, required: false })
  images?: any[];

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Café Latte'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

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
    example: 10.5
  })
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @ApiProperty({
    description: '¿El producto está restringido?',
    example: false
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isRestricted?: boolean;

  @ApiProperty({
    description: 'Stock máximo del producto',
    example: 10
  })
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  maxStock: number;

  @ApiProperty({
    description: 'ID de la categoría a la que pertenece el producto',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;
}
