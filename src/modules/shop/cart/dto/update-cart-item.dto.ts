import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'New quantity of the item',
    type: Number,
    minimum: 1
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Client ID',
    type: String,
    required: false
  })
  @IsUUID()
  @IsOptional()
  clientId?: string;
}
