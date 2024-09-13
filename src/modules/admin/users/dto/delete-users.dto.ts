import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class DeleteUsersDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true }) // Asegura que cada elemento en el array sea una cadena
  ids: string[];
}
