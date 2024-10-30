import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetProductDto {
  @ApiProperty({
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  priceMax?: number;

  @ApiProperty({
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  priceMin?: number;

  @ApiProperty({
    required: false
  })
  @IsOptional()
  @IsString()
  categoryName?: string;
}
