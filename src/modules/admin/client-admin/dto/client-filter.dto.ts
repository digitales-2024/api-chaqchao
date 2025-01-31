import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ClientFilterDto {
  @ApiProperty({
    description: 'Fecha de inicio para filtrar',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin para filtrar',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}
