import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProductVariationDto } from './create-product-variation.dto';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProductVariationDto extends PartialType(CreateProductVariationDto) {
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
  additionalPrice?: number;

  @ApiProperty()
  @IsUUID()
  productId?: string;
}
