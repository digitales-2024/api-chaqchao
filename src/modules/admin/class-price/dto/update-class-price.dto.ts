import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateClassPriceDto } from './create-class-price.dto';
import { ClassTypeUser, TypeCurrency } from '@prisma/client';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateClassPriceDto extends PartialType(CreateClassPriceDto) {
  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => value.toUpperCase())
  @IsString()
  classTypeUser?: ClassTypeUser;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  price?: number;

  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => value.toUpperCase())
  @IsString()
  typeCurrency?: TypeCurrency;
}
