import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateBusinessHourDto {
  @ApiProperty({
    description: 'Dia de la semana',
    example: 'MONDAY',
    enum: DayOfWeek
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim().toUpperCase())
  dayOfWeek: DayOfWeek;

  @ApiProperty({
    description: 'Hora de apertura',
    example: '08:00'
  })
  @IsNotEmpty()
  @IsString()
  openingTime: string;

  @ApiProperty({
    description: 'Hora de cierre',
    example: '18:00'
  })
  @IsNotEmpty()
  @IsString()
  closingTime: string;

  @ApiProperty({
    description: 'Id del negocio',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  businessId: string;
}
