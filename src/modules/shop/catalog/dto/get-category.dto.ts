import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Café',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;
}
