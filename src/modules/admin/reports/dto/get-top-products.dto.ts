import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class GetTopProductsDto {
  @ApiProperty({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2024-12-31' })
  @IsOptional()
  @IsString()
  endDate: string;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsString()
  limit: string;
}
