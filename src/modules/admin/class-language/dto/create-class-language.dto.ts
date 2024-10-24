import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateClassLanguageDto {
  @ApiProperty()
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsNotEmpty()
  languageName: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  businessId: string;
}
