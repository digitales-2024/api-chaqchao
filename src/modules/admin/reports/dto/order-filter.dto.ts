import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class OrderFilterDto {
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
  orderStatus?: OrderStatus;

  @ApiProperty()
  @IsOptional()
  @IsString()
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
