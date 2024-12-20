import { ApiProperty } from '@nestjs/swagger';
import { TypeClass } from '@prisma/client';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateClassScheduleDto {
  @ApiProperty({
    description: 'Tipo de clase',
    example: TypeClass.NORMAL,
    enum: TypeClass
  })
  @IsNotEmpty()
  @IsString()
  typeClass: TypeClass;

  @ApiProperty({
    description: 'Hora de inicio de la clase',
    example: '08:00'
  })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'Id de la empresa',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  businessId: string;
}
