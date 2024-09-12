import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdatePasswordClientDto {
  @ApiProperty({
    name: 'password',
    description: 'Client password',
    required: true
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
    name: 'newPassword',
    description: 'Client new password',
    required: true
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
    name: 'confirmPassword',
    description: 'Client confirm password',
    required: true
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
  confirmPassword: string;
}
