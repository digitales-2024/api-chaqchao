import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateRolDto {
  @ApiProperty({
    description: 'Name of the rol',
    example: 'admin'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name: string;

  @ApiProperty({
    description: 'Description of the rol',
    example: 'Administrator'
  })
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  description?: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  modulePermissions: string[];
}
