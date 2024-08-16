import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  email: string;

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

  @IsString()
  @IsMobilePhone()
  @Transform(({ value }) => value.trim())
  phone?: string;

  @IsString()
  @IsNotEmpty()
  rol: string;
}
