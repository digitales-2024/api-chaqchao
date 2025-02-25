import { ApiProperty } from '@nestjs/swagger';
import { TypeClass, TypeCurrency } from '@prisma/client';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetPricesClassDto {
  @ApiProperty({
    description: 'Tipo de moneda',
    enum: TypeCurrency,
    example: TypeCurrency.USD
  })
  @IsNotEmpty()
  @IsString()
  typeCurrency: TypeCurrency;

  @ApiProperty({
    description: 'Tipo de clase',
    enum: TypeClass,
    example: TypeClass.NORMAL
  })
  @IsNotEmpty()
  @IsString()
  typeClass: TypeClass;
}
