import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class FindClientByEmailDto {
  @ApiProperty({
    name: 'email',
    description: 'Correo electrónico del cliente',
    required: true,
    example: 'example@gmail.com'
  })
  @IsEmail()
  email: string;
}
