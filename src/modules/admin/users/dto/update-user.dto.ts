import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password'] as const)
) {
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'John Doe',
    required: false
  })
  name?: string;

  @ApiProperty({
    required: false,
    description: 'Número de teléfono del usuario',
    example: '1234567890'
  })
  phone?: string;

  @ApiProperty({
    required: false,
    description: 'Roles del usuario',
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001']
  })
  roles?: string[];
}
