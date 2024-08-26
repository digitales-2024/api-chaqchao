import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  description?: string;
}
