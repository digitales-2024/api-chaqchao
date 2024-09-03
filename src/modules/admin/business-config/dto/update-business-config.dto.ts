import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBusinessConfigDto } from './create-business-config.dto';
import { IsEmail, IsPhoneNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBusinessConfigDto extends PartialType(CreateBusinessConfigDto) {
  @ApiProperty()
  @IsString()
  @Transform(({ value }) => value.trim())
  businessName?: string;

  @ApiProperty()
  @IsString()
  @IsEmail()
  @Transform(({ value }) => value.trim())
  email?: string;

  @ApiProperty()
  @IsPhoneNumber('PE')
  contactNumber?: string;

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => value.trim())
  address?: string;
}
