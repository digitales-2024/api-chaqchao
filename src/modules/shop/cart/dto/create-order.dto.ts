import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'Nombre del cliente', type: String, example: 'John' })
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Apellido del cliente', type: String, example: 'Doe' })
  @IsString()
  customerLastName: string;

  @ApiProperty({
    description: 'Correo electrónico del cliente',
    type: String,
    example: 'pDx5G@example.com'
  })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ description: 'Teléfono del cliente', type: String, example: '987654321' })
  @IsString()
  customerPhone: string;

  @ApiProperty({
    description: 'Indica si alguien recogerá la orden',
    example: true,
    type: Boolean
  })
  @IsBoolean()
  someonePickup: boolean;

  @ApiProperty({
    description: 'Comentarios adicionales',
    example: 'Comentarios adicionales',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({
    description: 'Hora programada para la recogida',
    type: String,
    example: '2021-09-01T12:00:00-05:00',
    format: 'date-time'
  })
  @IsString()
  pickupTime: string;

  @ApiProperty({
    description: 'ID del cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    required: false
  })
  @IsString()
  @IsOptional()
  clientId?: string;
}
