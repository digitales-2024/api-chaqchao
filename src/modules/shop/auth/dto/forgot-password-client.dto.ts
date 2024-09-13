import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordClientDto {
  @ApiProperty({
    name: 'email',
    description: 'Client email'
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
