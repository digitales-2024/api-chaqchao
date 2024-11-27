import { ApiProperty } from '@nestjs/swagger';
import { BillingDocumentType, PaymentStatus } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Tipo de documento de facturación',
    example: 'INVOICE'
  })
  @IsString()
  billingDocumentType: BillingDocumentType;

  @ApiProperty({
    description: 'Nombre del cliente',
    example: 'John Doe'
  })
  @IsString()
  typeDocument: string;

  @ApiProperty({
    description: 'Número de documento del cliente',
    example: '12345678'
  })
  @IsString()
  documentNumber: string;

  @ApiProperty({
    description: 'Dirección de facturación',
    example: 'Av. Los Pinos 123'
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Ciudad de facturación',
    example: 'Lima'
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Departamento de facturación',
    example: 'Lima'
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'País de facturación',
    example: 'Perú'
  })
  @IsString()
  country: string;

  @ApiProperty({
    description: 'Código postal de facturación',
    example: '15023'
  })
  @IsString()
  postalCode: string;

  @ApiProperty({
    description: 'Número de teléfono del cliente',
    example: '987654321'
  })
  @IsString()
  paymentStatus: PaymentStatus;

  @ApiProperty({
    description: 'Nombre del negocio',
    example: 'Mi Tienda'
  })
  @IsOptional()
  @IsString()
  businessName?: string;
}
