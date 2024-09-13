import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsArray, IsNotEmpty, IsNumber, IsString, IsUrl, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { UpdateProductVariationDto } from '../../product-variation/dto/update-product-variation.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
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
  @IsNumber()
  price?: number;

  @ApiProperty()
  @IsString()
  @IsUrl()
  image?: string;

  @ApiProperty()
  @IsUUID()
  categoryId?: string;

  @ApiProperty()
  @IsArray()
  variationsUpdate?: UpdateProductVariationDto[];
}
