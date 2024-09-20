import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { CreateCartDto } from '../../cart/dto/create-cart.dto';

export class UpdateQuantityCartItemDto extends PartialType(CreateCartDto) {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  quantity?: number;
}
