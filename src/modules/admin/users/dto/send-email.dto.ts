import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'example@gmail'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Password123'
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
