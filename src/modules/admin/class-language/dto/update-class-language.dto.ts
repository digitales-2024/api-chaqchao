import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateClassLanguageDto } from './create-class-language.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateClassLanguageDto extends PartialType(CreateClassLanguageDto) {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  languageName?: string;
}