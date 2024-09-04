import { ApiProperty } from '@nestjs/swagger';
import { CreateClassesPriceConfigDto } from './create-classes-price-config.dto';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { CreateClassesLanguageDto } from './create-classes-language.dto';
import { CreateClassesRegistrationConfigDto } from './create-classes-registration-config.dto';

export class CreateClassesConfigDto {
  @ApiProperty()
  @IsArray()
  price: CreateClassesPriceConfigDto[];

  @ApiProperty()
  @IsArray()
  language: CreateClassesLanguageDto[];

  @ApiProperty()
  @IsArray()
  registration: CreateClassesRegistrationConfigDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  businessId: string;
}
