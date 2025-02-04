import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'New quantity of the item',
    type: Number,
    minimum: 1,
    example: 2
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Client ID',
    type: String,
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsOptional()
  clientId?: string;
}
