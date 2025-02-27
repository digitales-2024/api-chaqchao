import { ApiProperty } from '@nestjs/swagger';
import { TypeClass, TypeCurrency } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDate, IsEmail, IsNotEmpty, IsNumber, IsPhoneNumber, IsString } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({
    description: 'Tipo de clase',
    example: TypeClass.NORMAL,
    enum: TypeClass
  })
  @IsString()
  @IsNotEmpty()
  typeClass: TypeClass;

  @ApiProperty({
    name: 'userName',
    description: 'Nombre de usuario',
    example: 'John Doe'
  })
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  userName: string;

  @ApiProperty({
    name: 'userEmail',
    description: 'Correo electrónico de usuario',
    example: 'pDx5G@example.com'
  })
  @IsEmail()
  @Transform(({ value }) => value.trim())
  userEmail: string;

  @ApiProperty({
    name: 'userPhone',
    description: 'Teléfono de usuario',
    example: '+1234567890'
  })
  @IsPhoneNumber(null)
  @Transform(({ value }) => value.trim())
  userPhone: string;

  @ApiProperty({
    name: 'scheduleClass',
    description: 'Horario de clases',
    example: '2022-12-31T23:59:59Z'
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  scheduleClass: string;

  @ApiProperty({
    name: 'languageClass',
    description: 'Lenguaje de clase',
    example: 'español'
  })
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  languageClass: string;

  @ApiProperty({
    name: 'dateClass',
    description: 'Fecha de clase',
    example: '2022-12-31'
  })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  dateClass: Date;

  @ApiProperty({
    name: 'totalAdults',
    description: 'Total de adultos',
    example: 2
  })
  @IsNumber()
  totalAdults: number;

  @ApiProperty({
    name: 'totalChildren',
    description: 'Total de niños',
    example: 1
  })
  @IsNumber()
  totalChildren: number;

  @ApiProperty({
    name: 'typeCurrency',
    description: 'Tipo moneda',
    example: 'DOLAR',
    enum: TypeCurrency
  })
  @IsString()
  @Transform(({ value }) => value.trim().toUpperCase())
  typeCurrency: TypeCurrency;

  @ApiProperty({
    name: 'comments',
    description: 'Comentario',
    example: 'Comentario de la clase'
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  comments?: string;

  // Campos de PayPal
  @ApiProperty({
    name: 'paypalOrderId',
    description: 'PayPal Order ID',
    required: false,
    example: '1234567890'
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  paypalOrderId?: string;

  @ApiProperty({
    name: 'paypalOrderStatus',
    description: 'PayPal Order Status',
    required: false,
    example: 'COMPLETED'
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  paypalOrderStatus?: string;

  @ApiProperty({
    name: 'paypalAmount',
    description: 'PayPal Amount',
    required: false,
    example: '100.00'
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  paypalAmount?: string;

  @ApiProperty({
    name: 'paypalCurrency',
    description: 'PayPal Currency',
    required: false,
    example: 'USD'
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  paypalCurrency?: string;

  @ApiProperty({
    name: 'paypalDate',
    description: 'PayPal Date',
    required: false,
    example: '2022-12-31T23:59:59Z'
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  paypalDate?: string;
}
