import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class DeleteItemDto {
  @ApiProperty({
    description: 'Id del cliente',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsOptional()
  clientId?: string;
}
