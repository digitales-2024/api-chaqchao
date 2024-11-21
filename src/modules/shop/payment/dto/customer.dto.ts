import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CustomerDto {
  @ApiProperty({
    description: 'Correo electrónico del cliente',
    example: 'ejemplo@gmail.com'
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
