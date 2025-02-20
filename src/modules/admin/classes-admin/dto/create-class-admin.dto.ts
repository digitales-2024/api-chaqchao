import { ApiProperty } from '@nestjs/swagger';
import { ClassStatus, MethodPayment, TypeClass, TypeCurrency } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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
  @IsOptional()
  userName?: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email del usuario que registra la clase',
    required: true
  })
  @IsOptional()
  userEmail?: string;

  @ApiProperty({
    example: '123456789',
    description: 'Teléfono del usuario que registra la clase',
    required: true
  })
  @IsString()
  @IsOptional()
  userPhone?: string;

  @ApiProperty({
    example: 2,
    description: 'Número total de adultos',
    required: true
  })
  @IsNumber()
  totalAdults: number;

  @ApiProperty({
    example: 2,
    description: 'Número total de niños',
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  totalChildren: number;

  @ApiProperty({
    example: 3,
    description: 'Número total de personas',
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  totalParticipants: number;

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
    description: 'Precio total de los niños',
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  totalPriceChildren: number;

  @ApiProperty({
    example: 'español',
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
  dateClass: string;

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
  @IsOptional()
  comments?: string;

  @ApiProperty({
    example: 'Si tiene alguna alergia, por favor indicar',
    description: 'Requerimientos especiales de la clase',
    required: false
  })
  @IsString()
  @IsOptional()
  allergies?: string;

  @ApiProperty({
    example: 'Si es alguna ocasión especial, por favor indicar',
    description: 'Ocasión especial',
    required: false
  })
  @IsString()
  @IsOptional()
  occasion?: string;

  @ApiProperty({
    example: ClassStatus.CONFIRMED,
    description: 'Estado de la clase',
    required: false,
    enum: ClassStatus
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: '2022-01-01T00:00:00.000Z',
    description: 'Fecha de expiración de la clase',
    required: false
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Si la clase está cerrada',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiProperty({
    description: 'Tipo de moneda',
    example: TypeCurrency.USD,
    required: true,
    enum: TypeCurrency
  })
  @IsNotEmpty()
  @IsString()
  typeCurrency: TypeCurrency;

  @ApiProperty({
    description: 'Método de pago',
    example: MethodPayment.IZIPAY,
    enum: MethodPayment,
    required: true
  })
  @IsNotEmpty()
  @IsString()
  methodPayment: MethodPayment;

  // Campos de PayPal
  @ApiProperty({
    description: 'ID de orden de PayPal',
    example: 'PAY-1HK698868H3641444ABCD1234',
    required: false
  })
  @IsString()
  @IsOptional()
  paypalOrderId?: string;

  @ApiProperty({
    description: 'Estado de orden de PayPal',
    example: 'COMPLETED',
    required: false
  })
  @IsString()
  @IsOptional()
  paypalOrderStatus?: string;

  @ApiProperty({
    description: 'Monto de PayPal',
    example: '100.00',
    required: false
  })
  @IsString()
  @IsOptional()
  paypalAmount?: string;

  @ApiProperty({
    description: 'Moneda de PayPal',
    example: 'USD',
    required: false
  })
  @IsString()
  @IsOptional()
  paypalCurrency?: string;

  @ApiProperty({
    description: 'Fecha de PayPal',
    example: '2024-02-08T14:30:00Z',
    required: false
  })
  @IsString()
  @IsOptional()
  paypalDate?: string;

  // Campos de Izipay
  @ApiProperty({
    description: 'ID de transacción de Izipay',
    example: 'TR-123456789',
    required: false
  })
  @IsString()
  @IsOptional()
  izipayTransactionId?: string;

  @ApiProperty({
    description: 'Código de autorización de Izipay',
    example: 'AUTH123456',
    required: false
  })
  @IsString()
  @IsOptional()
  izipayAuthCode?: string;

  @ApiProperty({
    description: 'Marca de tarjeta de Izipay',
    example: 'VISA',
    required: false
  })
  @IsString()
  @IsOptional()
  izipayCardBrand?: string;

  @ApiProperty({
    description: 'Últimos 4 dígitos de la tarjeta de Izipay',
    example: '4532',
    required: false
  })
  @IsString()
  @IsOptional()
  izipayLastFourDigits?: string;
}
