import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class DeleteRolesDto {
  @ApiProperty({
    description: 'Identificadores de los roles a eliminar',
    example: ['1', '2', '3'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
