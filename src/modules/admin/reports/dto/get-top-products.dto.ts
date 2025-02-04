import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class GetTopProductsDto {
  @ApiProperty({
    description:
      'Fecha de inicio para filtrar los pedidos por un rango de fechas, en formato `YYYY-MM-DD`',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsString()
  startDate: string;

  @ApiProperty({
    description:
      'Fecha de fin para filtrar los pedidos por un rango de fechas, en formato `YYYY-MM-DD`',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsString()
  endDate: string;

  @ApiProperty({ description: 'Límite de productos a obtener', example: '10' })
  @IsOptional()
  @IsString()
  limit: string;
}
