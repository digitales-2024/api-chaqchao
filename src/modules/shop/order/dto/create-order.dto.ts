import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, IsEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  orderStatus: OrderStatus;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @ApiProperty()
  @IsString()
  pickupTime: string;

  @ApiProperty()
  @IsString()
  comments: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  cartId: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  someonePickup: boolean;
}
