import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CreateClassRegistrationDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  closeBeforeStartInterval: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  finalRegistrationCloseInterval: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  businessId: string;
}
