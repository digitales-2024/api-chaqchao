import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBusinessHourDto } from './create-business-hour.dto';
import { IsString } from 'class-validator';

export class UpdateBusinessHourDto extends PartialType(CreateBusinessHourDto) {
  @ApiProperty({
    description: 'Hora de apertura',
    example: '08:00',
    required: false
  })
  @IsString()
  openingTime?: string;

  @ApiProperty({
    description: 'Hora de cierre',
    example: '18:00',
    required: false
  })
  @IsString()
  closingTime?: string;
}
