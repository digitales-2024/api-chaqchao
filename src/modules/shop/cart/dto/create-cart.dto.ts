import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmpty, IsNotEmpty, IsUUID } from 'class-validator';
import { CartStatus } from '@prisma/client';
export class CreateCartDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiProperty()
  @IsEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  cartStatus: CartStatus;
}
