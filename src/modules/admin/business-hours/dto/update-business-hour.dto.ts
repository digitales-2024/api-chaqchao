import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBusinessHourDto } from './create-business-hour.dto';
import { IsString } from 'class-validator';

export class UpdateBusinessHourDto extends PartialType(CreateBusinessHourDto) {
  @ApiProperty()
  @IsString()
  openingTime?: string;

  @ApiProperty()
  @IsString()
  closingTime?: string;
}
