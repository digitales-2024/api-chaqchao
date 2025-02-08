import { ApiProperty } from '@nestjs/swagger';
import { ClassStatus, MethodPayment, TypeClass, TypeCurrency } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateClassAdminDto {
  @ApiProperty({
    description: 'Tipo de clase',
    example: TypeClass.NORMAL,
    required: true,
    enum: TypeClass
  })
  @IsNotEmpty()
  @IsString()
  typeClass: TypeClass;

  @ApiProperty({
    example: 'John Doe',
    description: 'Username del usuario que registra la clase',
    required: true
  })
  @Transform(({ value }) => value.trim())
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email del usuario que registra la clase',
    required: true
  })
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;

  @ApiProperty({
    example: '123456789',
    description: 'Tel fono del usuario que registra la clase',
    required: true
  })
  @IsString()
  userPhone: string;

  @ApiProperty({
    example: 2,
    description: 'N mero total de adultos',
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  totalAdults: number;

  @ApiProperty({
    example: 2,
    description: 'N mero total de ni os',
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  totalChildren: number;

  @ApiProperty({
    example: 20.0,
    description: 'Precio total de la clase',
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  totalPrice: number;

  @ApiProperty({
    example: 10.0,
    description: 'Precio total de los adultos',
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  totalPriceAdults: number;

  @ApiProperty({
    example: 10.0,
    description: 'Precio total de los ni os',
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  totalPriceChildren: number;

  @ApiProperty({
    example: 'espa ol',
    description: 'Idioma de la clase',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  languageClass: string;

  @ApiProperty({
    example: '2022-01-01T00:00:00.000Z',
    description: 'Fecha de la clase',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  dateClass: Date;

  @ApiProperty({
    example: '10:00 AM',
    description: 'Horario de la clase',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  scheduleClass: string;

  @ApiProperty({
    example: 'Comentarios de la clase',
    description: 'Comentarios de la clase',
    required: false
  })
  @IsString()
  comments?: string;

  @ApiProperty({
    example: ClassStatus.CONFIRMED,
    description: 'Estado de la clase',
    required: true,
    enum: ClassStatus
  })
  status: string;

  @ApiProperty({
    example: '2022-01-01T00:00:00.000Z',
    description: 'Fecha de expiraci n de la clase',
    required: true
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Si la clase está cerrada',
    example: true,
    required: true
  })
  @IsNotEmpty()
  @IsBoolean()
  isClosed: boolean;

  @ApiProperty({
    description: 'Tipo de moneda',
    example: TypeCurrency.USD,
    required: true
  })
  @IsNotEmpty()
  @IsString()
  typeCurrency: TypeCurrency;

  @ApiProperty({
    description: 'Método de pago',
    example: MethodPayment.IZIPAY,
    enum: MethodPayment
  })
  @IsNotEmpty()
  @IsString()
  methodPayment: MethodPayment;
}
