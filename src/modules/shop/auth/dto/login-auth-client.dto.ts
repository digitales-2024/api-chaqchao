import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginAuthClientDto {
  @ApiProperty({
    name: 'email',
    description: 'Correo electrónico del cliente'
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    name: 'password',
    description: 'Contraseña del cliente'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
