import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordClientDto {
  @ApiProperty({
    name: 'email',
    description: 'Correo electrónico del cliente'
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
