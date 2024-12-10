import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class UpdateStatusBillingDocumentDto {
  @ApiProperty({
    description: 'Estado de pago',
    enum: PaymentStatus,
    example: PaymentStatus.PAID
  })
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  paymentStatus?: PaymentStatus;
}
