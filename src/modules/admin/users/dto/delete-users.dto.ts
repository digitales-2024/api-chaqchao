import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class DeleteUsersDto {
  @ApiProperty({
    description: 'Ids de los usuarios a eliminar',
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
