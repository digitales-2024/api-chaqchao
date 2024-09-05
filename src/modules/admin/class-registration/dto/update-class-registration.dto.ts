import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateClassRegistrationDto } from './create-class-registration.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateClassRegistrationDto extends PartialType(CreateClassRegistrationDto) {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  closeBeforeStartInterval?: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  finalRegistrationCloseInterval?: number;
}
