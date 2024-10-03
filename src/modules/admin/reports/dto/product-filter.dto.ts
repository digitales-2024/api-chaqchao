import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class ProductFilterDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  priceMax?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  priceMin?: string;

  @ApiProperty()
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

  @ApiProperty()
  @IsOptional()
  @IsDefined()
  @Transform(({ obj, key }) => {
    const value = obj[key];
    if (typeof value === 'string') {
      return obj[key] === 'true';
    }

    return value;
  })
  isRestricted?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsDefined()
  @Transform(({ obj, key }) => {
    const value = obj[key];
    if (typeof value === 'string') {
      return obj[key] === 'true';
    }

    return value;
  })
  isAvailable?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  categoryName?: string;
}
