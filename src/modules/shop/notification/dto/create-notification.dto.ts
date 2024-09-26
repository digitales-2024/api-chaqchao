import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  notificationType: NotificationType;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  orderId: string;
}
