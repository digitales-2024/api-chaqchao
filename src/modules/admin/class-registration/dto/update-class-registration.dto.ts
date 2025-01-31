import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateClassRegistrationDto } from './create-class-registration.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateClassRegistrationDto extends PartialType(CreateClassRegistrationDto) {
  @ApiProperty({
    description: 'Intervalo de tiempo en minutos para cerrar la clase antes de que comience',
    example: 30,
    required: false
  })
  @IsNumber()
  @IsNotEmpty()
  closeBeforeStartInterval?: number;

  @ApiProperty({
    description:
      'Intervalo de tiempo en minutos para cerrar el registro de la clase después de que comience',
    example: 60,
    required: false
  })
  @IsNumber()
  @IsNotEmpty()
  finalRegistrationCloseInterval?: number;
}
