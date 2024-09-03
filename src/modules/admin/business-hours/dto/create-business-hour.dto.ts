import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateBusinessHourDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim().toUpperCase())
  dayOfWeek: DayOfWeek;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  openingTime: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  closingTime: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  businessId: string;
}
