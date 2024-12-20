import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateClassScheduleDto } from './create-class-schedule.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { TypeClass } from '@prisma/client';

export class UpdateClassScheduleDto extends PartialType(CreateClassScheduleDto) {
  @ApiProperty({
    description: 'Tipo de clase',
    example: TypeClass.NORMAL,
    required: false,
    enum: TypeClass
  })
  @IsString()
  @IsNotEmpty()
  typeClass?: TypeClass;

  @ApiProperty({
    description: 'Hora de inicio de la clase',
    example: '08:00',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  startTime?: string;
}
