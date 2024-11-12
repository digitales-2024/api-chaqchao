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
    description: 'Client name'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty({
    name: 'email',
    description: 'Client email'
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  email: string;

  @ApiProperty({
    name: 'password',
    description: 'Client password'
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
    description: 'Client phone',
    required: false
  })
  @IsPhoneNumber(null)
  @Transform(({ value }) => value.trim())
  phone?: string;

  @ApiProperty({
    name: 'birthdate',
    description: 'Client birthdate',
    required: false
  })
  @IsString()
  @IsOptional()
  birthDate?: Date;

  @ApiProperty({
    name: 'term',
    description: 'Client term and conditions'
  })
  @IsBoolean()
  @IsNotEmpty()
  terms: boolean;
}
