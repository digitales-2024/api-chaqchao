import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CustomerDto } from './customer.dto';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Monto del pago',
    example: 100
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Moneda del pago',
    example: 'PEN'
  })
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'ID del pedido',
    example: '123456'
  })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Datos del cliente',
    example: {
      email: 'exaple@gmail.com'
    }
  })
  @IsNotEmpty()
  @Type(() => CustomerDto)
  customer: CustomerDto;
}
