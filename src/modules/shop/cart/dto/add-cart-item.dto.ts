import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    description: 'Id of product to add to cart',
    type: String,
    format: 'uuid'
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantity of product to add to cart',
    type: Number,
    default: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
