import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class OrderFilterDto {
  @ApiProperty({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty()
  @IsOptional()
  orderStatus?: OrderStatus;

  @ApiProperty({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value) {
      return new Date(value).toISOString();
    }
    return value;
  })
  date?: string;

  @ApiProperty()
  @IsOptional()
  totalAmount: number;

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
}
