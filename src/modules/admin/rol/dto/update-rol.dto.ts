import { PartialType } from '@nestjs/mapped-types';
import { CreateRolDto } from './create-rol.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRolDto extends PartialType(CreateRolDto) {
  @ApiPropertyOptional({
    description: 'Nombre del rol',
    example: 'admin',
    required: false
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Descripción del ROL',
    example: 'Administrator',
    required: false
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Permisos del ROL',
    example: ['1', '2'],
    required: false
  })
  rolPermissions?: string[];
}
