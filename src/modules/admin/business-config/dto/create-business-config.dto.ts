import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class CreateBusinessConfigDto {
  @ApiProperty({
    description: 'RUC del negocio',
    example: '12345678901'
  })
  @IsString()
  @IsNotEmpty()
  ruc: string;

  @ApiProperty({
    description: 'Nombre del negocio',
    example: 'Chaqchao'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  businessName: string;

  @ApiProperty({
    description: 'Correo electrónica del negocio',
    example: '8l2D3@example.com'
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.trim())
  email: string;

  @ApiProperty({
    description: 'Número de contacto del negocio',
    example: '987654321'
  })
  @IsPhoneNumber('PE')
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  contactNumber: string;

  @ApiProperty({
    description: 'Dirección del negocio',
    example: 'Av. Los Pinos 123, Lima, Perú'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  address: string;
}
