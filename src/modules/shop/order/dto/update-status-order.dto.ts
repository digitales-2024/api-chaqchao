import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsEnum } from 'class-validator';

export class UpdateStatusOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  @Transform(({ value }) => value.trim().toUpperCase())
  orderStatus: OrderStatus;
}
