import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateProductVariationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => value?.trim() || '')
  description?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  additionalPrice: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  productId: string;
}
