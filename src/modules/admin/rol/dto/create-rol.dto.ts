import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateRolDto {
  @ApiProperty({
    description: 'Nombre del rol',
    example: 'admin'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name: string;

  @ApiProperty({
    description: 'Descripción del rol',
    example: 'Rol de administrador',
    required: false
  })
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  description?: string;

  @ApiProperty({
    description: 'Permisos del rol',
    example: ['permiso1', 'permiso2', 'permiso3']
  })
  @IsArray()
  @IsNotEmpty()
  rolPermissions: string[];
}
