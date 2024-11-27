import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class DeleteItemDto {
  @ApiProperty({
    description: 'Id del cliente',
    type: String
  })
  @IsUUID()
  @IsOptional()
  clientId?: string;
}
