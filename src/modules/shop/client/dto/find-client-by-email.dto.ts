import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class FindClientByEmailDto {
  @ApiProperty({
    description: 'Correo electrónico del cliente',
    example: 'example@gmail.com'
  })
  @IsEmail()
  email: string;
}
