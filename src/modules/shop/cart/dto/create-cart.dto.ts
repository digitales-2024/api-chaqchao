import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { CartStatus } from '@prisma/client';

export class CreateCartDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  cartStatus: CartStatus;
}
