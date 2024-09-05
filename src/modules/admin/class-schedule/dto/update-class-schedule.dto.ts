import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateClassScheduleDto } from './create-class-schedule.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateClassScheduleDto extends PartialType(CreateClassScheduleDto) {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  startTime?: string;
}
