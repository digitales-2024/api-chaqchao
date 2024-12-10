import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from 'class-validator';

export class CreateClientDto {
  @ApiProperty({
    name: 'name',
    description: 'Nombre del cliente'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty({
    name: 'email',
    description: 'Correo electrónico del cliente'
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  email: string;

  @ApiProperty({
    name: 'password',
    description: 'Contraseña del cliente'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'the password is too weak, it must contain at least one uppercase letter, one lowercase letter, one number'
  })
  @Transform(({ value }) => value.trim())
  password: string;

  @ApiProperty({
    name: 'phone',
    description: 'Teléfono del cliente',
    required: false
  })
  @IsPhoneNumber(null)
  @Transform(({ value }) => value.trim())
  phone?: string;

  @ApiProperty({
    name: 'birthdate',
    description: 'Fecha de nacimiento del cliente',
    required: false
  })
  @IsString()
  @IsOptional()
  birthDate?: Date;

  @ApiProperty({
    name: 'term',
    description: 'Término y condiciones del cliente'
  })
  @IsBoolean()
  @IsNotEmpty()
  terms: boolean;
}
