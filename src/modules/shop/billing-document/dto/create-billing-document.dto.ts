import { ApiProperty } from '@nestjs/swagger';
import { BillingDocumentType, PaymentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmpty, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBillingDocumentDto {
  @ApiProperty()
  @IsEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  billingDocumentType: BillingDocumentType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty()
  @IsNumber()
  totalAmount: number;

  @ApiProperty()
  @IsEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  paymentStatus: PaymentStatus;

  @ApiProperty()
  @IsString()
  issuedAt: string;
}
