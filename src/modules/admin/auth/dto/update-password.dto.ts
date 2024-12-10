import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from '../../users/dto';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: 'Contraseña actual del usuario',
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Nueva contraseña del usuario',
    example: '123456',
    minLength: 6,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'the new password is too weak, it must contain at least one uppercase letter, one lowercase letter, one number'
  })
  @Transform(({ value }) => value.trim())
  newPassword: string;

  @ApiProperty({
    description: 'Confirmar nueva contraseña del usuario',
    example: '123456',
    minLength: 6,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'the confirm password is too weak, it must contain at least one uppercase letter, one lowercase letter, one number'
  })
  @Transform(({ value }) => value.trim())
  confirmPassword: string;
}
