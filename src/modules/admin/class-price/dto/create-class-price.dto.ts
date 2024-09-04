import { ApiProperty } from '@nestjs/swagger';
import { ClassTypeUser, TypeCurrency } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateClassPriceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  classTypeUser: ClassTypeUser;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  TypeCurrency: TypeCurrency;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  businessId: string;
}
