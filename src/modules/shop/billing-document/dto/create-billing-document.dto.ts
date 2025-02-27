import { ApiProperty } from '@nestjs/swagger';
import { BillingDocumentType, PaymentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsUUID, IsNotEmpty, IsNumber, IsString, IsEmpty, IsOptional } from 'class-validator';

export class CreateBillingDocumentDto {
  @ApiProperty({
    title: 'Tipo de documento de facturación',
    description: 'Tipo de documento de facturación',
    enum: BillingDocumentType,
    example: BillingDocumentType.INVOICE
  })
  @IsNotEmpty()
  billingDocumentType?: BillingDocumentType;

  @ApiProperty({
    title: 'Tipo de documento',
    description: 'Tipo de documento',
    example: 'DNI'
  })
  @IsString()
  typeDocument: string;

  @ApiProperty({
    title: 'Número de documento',
    description: 'Número de documento',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty({
    title: 'Dirección',
    description: 'Dirección de facturación',
    example: 'Av. Los Pinos 123'
  })
  @IsString()
  address: string;

  @ApiProperty({
    title: 'Ciudad',
    description: 'Ciudad de facturación',
    example: 'Lima'
  })
  @IsString()
  city: string;

  @ApiProperty({
    title: 'Departamento',
    description: 'Departamento de facturación',
    example: 'Lima'
  })
  @IsString()
  state: string;

  @ApiProperty({
    title: 'País',
    description: 'País de facturación',
    example: 'Perú'
  })
  @IsString()
  country: string;

  @ApiProperty({
    title: 'Código postal',
    description: 'Código postal de facturación',
    example: '15001'
  })
  @IsString()
  postalCode: string;

  @ApiProperty({
    title: 'Estado de pago',
    description: 'Estado de pago',
    enum: PaymentStatus,
    example: PaymentStatus.RUNNING
  })
  @IsEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  paymentStatus?: PaymentStatus;

  @ApiProperty({
    title: 'Fecha de emisión',
    description: 'Fecha de emisión',
    example: '2021-10-01'
  })
  @IsString()
  issuedAt: string;

  @ApiProperty({
    title: 'Identificador de la orden',
    description: 'Identificador de la orden',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @ApiProperty({
    title: 'Monto total',
    description: 'Monto total',
    example: 10.0
  })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({
    title: 'Nombre de la empresa',
    description: 'Nombre de la empresa',
    example: 'Mi empresa'
  })
  @IsString()
  @IsOptional()
  businessName?: string;
}
