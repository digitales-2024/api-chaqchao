import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class UpdateStatusBillingDocumentDto {
  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  paymentStatus?: PaymentStatus;
}
