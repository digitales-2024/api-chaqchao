import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CreateClassRegistrationDto {
  @ApiProperty({
    description: 'Intervalo de tiempo en minutos para cerrar la clase antes de que comience',
    example: 30
  })
  @IsNumber()
  @IsNotEmpty()
  closeBeforeStartInterval: number;

  @ApiProperty({
    description:
      'Intervalo de tiempo en minutos para cerrar el registro de la clase después de que comience',
    example: 60
  })
  @IsNumber()
  @IsNotEmpty()
  finalRegistrationCloseInterval: number;

  @ApiProperty({
    description: 'Id del negocio',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  businessId: string;
}
