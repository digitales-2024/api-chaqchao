import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class DeleteProductsDto {
  @ApiProperty({
    description: 'IDs de los productos a eliminar',
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
