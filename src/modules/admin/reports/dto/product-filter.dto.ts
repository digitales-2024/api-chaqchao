import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ProductFilterDto {
  @ApiProperty({
    description:
      'Fecha de inicio para filtrar los pedidos por un rango de fechas, en formato `YYYY-MM-DD`',
    example: '2024-01-01',
    required: false
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    description:
      'Fecha de fin para filtrar los pedidos por un rango de fechas, en formato `YYYY-MM-DD`',
    example: '2024-12-31',
    required: false
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({
    description: 'Filtrado por una fecha específica, en formato `YYYY-MM-DD`',
    example: '2024-01-01',
    required: false
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({
    description: 'Filtrado por precio max de los productos',
    example: 10.5,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  priceMax?: number;

  @ApiProperty({
    description: 'Filtrado por precio min de los productos',
    example: 5.5,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  priceMin?: number;

  @ApiProperty({
    description: 'Filtrado por nombre de la categoría',
    example: 'Chocolates',
    required: false
  })
  @IsOptional()
  @IsString()
  categoryName?: string;
}
