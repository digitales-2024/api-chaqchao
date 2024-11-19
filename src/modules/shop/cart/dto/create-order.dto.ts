import { IsString, IsEmail, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'Nombre del cliente', type: String })
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Apellido del cliente', type: String })
  @IsString()
  customerLastName: string;

  @ApiProperty({ description: 'Correo electrónico del cliente', type: String })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ description: 'Teléfono del cliente', type: String, required: false })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({
    description: 'Indica si alguien recogerá la orden',
    type: Boolean,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  someonePickup?: boolean;

  @ApiProperty({ description: 'Comentarios adicionales', type: String, required: false })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({
    description: 'Hora programada para la recogida',
    type: String,
    format: 'date-time'
  })
  @IsDate()
  pickupTime: Date;
}
