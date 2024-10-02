import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

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
  isActive?: boolean;
}
