import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginAuthClientDto {
  @ApiProperty({
    name: 'email',
    description: 'Client email'
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    name: 'password',
    description: 'Client password'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
