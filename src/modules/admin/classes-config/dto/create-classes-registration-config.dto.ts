import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateClassesRegistrationConfigDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  closeRegistration: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  finalRegistration: number;
}
