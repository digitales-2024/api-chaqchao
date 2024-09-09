import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({
    name: 'name',
    description: 'Client name'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    name: 'email',
    description: 'Client email'
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    name: 'password',
    description: 'Client password'
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    name: 'phone',
    description: 'Client phone'
  })
  @IsPhoneNumber(null)
  @Transform(({ value }) => value.trim())
  phone?: string;

  @ApiProperty({
    name: 'birthdate',
    description: 'Client birthdate'
  })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  birthDate?: Date;
}
