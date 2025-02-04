import { ApiProperty } from '@nestjs/swagger';
import { TypeClass } from '@prisma/client';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateClassCapacityDto {
  @ApiProperty({
    description: 'Tipo de clase',
    example: TypeClass.NORMAL,
    enum: TypeClass
  })
  @IsString()
  @IsNotEmpty()
  typeClass: TypeClass;

  @ApiProperty({
    description: 'Capacidad mínima de la clase',
    example: 10
  })
  @IsNotEmpty()
  @IsNumber()
  minCapacity: number;

  @ApiProperty({
    description: 'Capacidad máxima de la clase',
    example: 20
  })
  @IsNotEmpty()
  @IsNumber()
  maxCapacity: number;
}
