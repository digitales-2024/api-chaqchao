import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from '../../users/dto';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePasswordDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsNotEmpty()
  password: string;

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
