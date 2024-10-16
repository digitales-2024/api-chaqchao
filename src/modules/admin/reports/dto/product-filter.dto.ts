import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ProductFilterDto {
  @ApiProperty({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  priceMax?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  priceMin?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  categoryName?: string;
}
