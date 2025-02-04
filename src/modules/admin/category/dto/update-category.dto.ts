import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Family } from '@prisma/client';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Chocolates',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name?: string;

  @ApiProperty({
    description: 'Descripción de la categoría',
    example: 'Chocolates de diferentes sabores',
    required: false
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;

  @ApiProperty({
    description: 'Familia de la categoría',
    example: 'CHOCOLAT',
    enum: Family,
    required: false
  })
  @IsString()
  family?: Family;
}
