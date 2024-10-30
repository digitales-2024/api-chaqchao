import { ApiProperty } from '@nestjs/swagger';
import { TypeCurrency } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDate, IsEmail, IsNumber, IsPhoneNumber, IsString } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({
    name: 'userName',
    description: 'User name'
  })
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  userName: string;

  @ApiProperty({
    name: 'userEmail',
    description: 'User email'
  })
  @IsEmail()
  @Transform(({ value }) => value.trim())
  userEmail: string;

  @ApiProperty({
    name: 'userPhone',
    description: 'User phone'
  })
  @IsPhoneNumber(null)
  @Transform(({ value }) => value.trim())
  userPhone: string;

  @ApiProperty({
    name: 'scheduleClass',
    description: 'Class schedule'
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  scheduleClass: string;

  @ApiProperty({
    name: 'languageClass',
    description: 'Class language'
  })
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  languageClass: string;

  @ApiProperty({
    name: 'dateClass',
    description: 'Class date'
  })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  dateClass: Date;

  @ApiProperty({
    name: 'totalAdults',
    description: 'Total adults'
  })
  @IsNumber()
  totalAdults: number;

  @ApiProperty({
    name: 'totalChildren',
    description: 'Total children'
  })
  @IsNumber()
  totalChildren: number;

  @ApiProperty({
    name: 'typeCurrency',
    description: 'Type currency'
  })
  @IsString()
  @Transform(({ value }) => value.trim().toUpperCase())
  typeCurrency: TypeCurrency;

  @ApiProperty({
    name: 'comments',
    description: 'Comments'
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  comments?: string;

  // Campos de PayPal
  @ApiProperty({
    name: 'paypalOrderId',
    description: 'PayPal Order ID',
    required: false
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  paypalOrderId?: string;

  @ApiProperty({
    name: 'paypalOrderStatus',
    description: 'PayPal Order Status',
    required: false
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  paypalOrderStatus?: string;

  @ApiProperty({
    name: 'paypalAmount',
    description: 'PayPal Amount',
    required: false
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  paypalAmount?: string;

  @ApiProperty({
    name: 'paypalCurrency',
    description: 'PayPal Currency',
    required: false
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  paypalCurrency?: string;

  @ApiProperty({
    name: 'paypalDate',
    description: 'PayPal Date',
    required: false
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  paypalDate?: string;
}
