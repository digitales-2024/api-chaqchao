import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ClientFilterDto {
  @ApiProperty({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
