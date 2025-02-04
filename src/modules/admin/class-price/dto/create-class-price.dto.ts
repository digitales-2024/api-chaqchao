import { ApiProperty } from '@nestjs/swagger';
import { ClassTypeUser, TypeClass, TypeCurrency } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateClassPriceDto {
  @ApiProperty({
    description: 'Tipo de clase',
    enum: TypeClass,
    example: TypeClass.NORMAL
  })
  @IsString()
  @IsNotEmpty()
  typeClass: TypeClass;

  @ApiProperty({
    description: 'Tipo de usuario al que se le asignará el precio de la clase',
    enum: ClassTypeUser,
    example: ClassTypeUser.ADULT
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  classTypeUser: ClassTypeUser;

  @ApiProperty({
    description: 'Precio de la clase',
    example: 100
  })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Tipo de moneda en la que se asignará el precio de la clase',
    enum: TypeCurrency,
    example: TypeCurrency.DOLAR
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  typeCurrency: TypeCurrency;

  @ApiProperty({
    description: 'Id del negocio al que se le asignará el precio de la clase',
    example: 'e3d3f1c6-2b1a-4f3d-9e0e-5f1b4b3b4b3b'
  })
  @IsUUID()
  @IsNotEmpty()
  businessId: string;
}
