import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDefined, IsNumber, IsOptional, IsString } from 'class-validator';

export class OrderFilterDto {
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
    example: '2024-01-01',
    required: false
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({
    description: 'Filtrado por estado de los pedidos',
    example: OrderStatus.COMPLETED,
    enum: OrderStatus,
    required: false
  })
  @IsOptional()
  orderStatus?: OrderStatus;

  @ApiProperty({
    description: 'Filtrado por fecha de los pedidos, en formato `YYYY-MM-DD`',
    example: '2024-01-01',
    required: false
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value) {
      return new Date(value).toISOString();
    }
    return value;
  })
  date?: string;

  @ApiProperty({
    description: 'Rango de precios para filtrar los pedidos',
    example: 10,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  priceMax?: number;

  @ApiProperty({
    description: 'Rango de precios para filtrar los pedidos',
    example: 100,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  priceMin?: number;

  @ApiProperty({
    description: 'Filtrado por activo o inactivo',
    example: true,
    required: false
  })
  @IsOptional()
  @IsDefined()
  @Transform(({ obj, key }) => {
    const value = obj[key];
    if (typeof value === 'string') {
      return obj[key] === 'true';
    }

    return value;
  })
  public isActive?: boolean;
}
