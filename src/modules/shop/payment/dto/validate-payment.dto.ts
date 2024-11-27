import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class ValidatePaymentDto {
  @ApiProperty({
    description: 'Respuesta del cliente',
    example: {
      status: 'success',
      message: 'Pago exitoso',
      amount: 100
    }
  })
  @IsNotEmpty()
  @IsObject()
  clientAnswer: Record<string, any>;

  @ApiProperty({
    description: 'Hash de la respuesta',
    example: 'b1d0d3e6b2f3f7'
  })
  @IsNotEmpty()
  @IsString()
  hash: string;
}
