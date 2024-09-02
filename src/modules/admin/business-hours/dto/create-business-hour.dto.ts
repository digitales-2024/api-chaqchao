import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';
import { IsDate, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateBusinessHourDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  dayOfWeek: DayOfWeek;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  openingTime: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  closingTime: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  businessId: string;
}
