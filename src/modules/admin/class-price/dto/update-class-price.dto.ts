import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateClassPriceDto } from './create-class-price.dto';
import { ClassTypeUser, TypeClass, TypeCurrency } from '@prisma/client';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateClassPriceDto extends PartialType(CreateClassPriceDto) {
  @ApiProperty({
    description: 'Tipo de clase',
    type: TypeClass,
    enum: TypeClass,
    example: TypeClass.NORMAL,
    required: false
  })
  @IsNotEmpty()
  @IsString()
  typeClass?: TypeClass;

  @ApiProperty({
    description: 'Tipo de usuario al que se le asignará el precio de la clase',
    type: ClassTypeUser,
    enum: ClassTypeUser,
    example: ClassTypeUser.ADULT,
    required: false
  })
  @IsNotEmpty()
  @Transform(({ value }) => value.toUpperCase())
  @IsString()
  classTypeUser?: ClassTypeUser;

  @ApiProperty({
    description: 'Precio de la clase',
    example: 100,
    required: false
  })
  @IsNotEmpty()
  @IsNumber()
  price?: number;

  @ApiProperty({
    description: 'Tipo de moneda en la que se asignará el precio de la clase',
    type: TypeCurrency,
    enum: TypeCurrency,
    example: TypeCurrency.DOLAR,
    required: false
  })
  @IsNotEmpty()
  @Transform(({ value }) => value.toUpperCase())
  @IsString()
  typeCurrency?: TypeCurrency;
}
