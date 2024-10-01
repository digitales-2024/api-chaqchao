import { ApiProperty } from '@nestjs/swagger';
import { BillingDocumentType, PaymentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsUUID, IsNotEmpty, IsNumber, IsString, IsEmpty, IsOptional } from 'class-validator';

export class CreateBillingDocumentDto {
  @ApiProperty()
  @IsEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  billingDocumentType?: BillingDocumentType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty()
  @IsNumber()
  totalAmount: number;

  @ApiProperty()
  @IsOptional()
  ruc: string;

  @ApiProperty()
  @IsEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  paymentStatus?: PaymentStatus;

  @ApiProperty()
  @IsString()
  issuedAt: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  orderId: string;
}
