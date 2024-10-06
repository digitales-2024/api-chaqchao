import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetCategoryDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;
}
