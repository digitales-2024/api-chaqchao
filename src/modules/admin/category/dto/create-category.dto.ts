import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Chocolates'
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Descripción de la categoría',
    example: 'Chocolates de diferentes sabores'
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;

  @ApiProperty({
    description: 'Familia de la categoría',
    example: 'CHOCOLAT'
  })
  @IsString()
  family: string;
}
