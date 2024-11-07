import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Family } from '@prisma/client';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name?: string;

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;

  @ApiProperty()
  family?: Family;
}
