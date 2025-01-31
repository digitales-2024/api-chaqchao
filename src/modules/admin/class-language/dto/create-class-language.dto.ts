import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateClassLanguageDto {
  @ApiProperty({
    description: 'Idioma de la clase',
    example: 'español'
  })
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsNotEmpty()
  languageName: string;

  @ApiProperty({
    description: 'Id del negocio',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  businessId: string;
}
