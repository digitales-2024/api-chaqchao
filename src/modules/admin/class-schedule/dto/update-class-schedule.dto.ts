import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateClassScheduleDto } from './create-class-schedule.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateClassScheduleDto extends PartialType(CreateClassScheduleDto) {
  @ApiProperty({
    description: 'Hora de inicio de la clase',
    example: '08:00',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  startTime?: string;
}
