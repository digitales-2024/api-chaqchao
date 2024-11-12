import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class CartDto {
  @ApiProperty()
  @IsArray()
  cartItems: string[];
}
