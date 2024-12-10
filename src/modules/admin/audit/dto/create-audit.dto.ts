import { ApiProperty } from '@nestjs/swagger';
import { AuditActionType } from '@prisma/client';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateAuditDto {
  @ApiProperty({
    description: 'Identificador único de la entidad que se está auditando',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsString()
  entityId: string;

  @ApiProperty({
    description: 'Tipo de entidad que se está auditando',
    example: 'user'
  })
  @IsNotEmpty()
  @IsString()
  entityType: string;

  @ApiProperty({
    description: 'Acción que se realizó sobre la entidad',
    example: 'CREATE',
    type: 'enum',
    enum: AuditActionType
  })
  @IsNotEmpty()
  @IsString()
  action: AuditActionType;

  @ApiProperty({
    description: 'Identificador único del usuario que realizó la acción',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsString()
  performedById: string;

  @ApiProperty({
    description: 'Fecha y hora en la que se realizó la acción',
    example: '2021-08-18T16:00:00.000Z'
  })
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;
}
