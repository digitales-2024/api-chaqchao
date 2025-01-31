import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBusinessConfigDto } from './create-business-config.dto';
import { IsEmail, IsPhoneNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBusinessConfigDto extends PartialType(CreateBusinessConfigDto) {
  @ApiProperty({
    description: 'RUC del negocio',
    example: '12345678901',
    required: false
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  businessName?: string;

  @ApiProperty({
    description: 'Correo electrónica del negocio',
    example: '8l2D3@example.com',
    required: false
  })
  @IsString()
  @IsEmail()
  @Transform(({ value }) => value.trim())
  email?: string;

  @ApiProperty({
    description: 'Número de contacto del negocio',
    example: '987654321',
    required: false
  })
  @IsPhoneNumber('PE')
  contactNumber?: string;

  @ApiProperty({
    description: 'Dirección del negocio',
    example: 'Av. Los Pinos 123, Lima, Perú',
    required: false
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  address?: string;
}
