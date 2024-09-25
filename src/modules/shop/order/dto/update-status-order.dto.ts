import { ApiProperty, PartialType } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

export class UpdateStatusOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  @Transform(({ value }) => value.trim().toUpperCase())
  orderStatus: OrderStatus;
}
