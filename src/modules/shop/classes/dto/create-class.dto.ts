import { ApiProperty } from '@nestjs/swagger';
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
    name: 'dateClass',
    description: 'Class date'
  })
  @IsDate()
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  dateClass: Date;

  @ApiProperty({
    name: 'totalParticipants',
    description: 'Total participants'
  })
  @IsNumber()
  totalParticipants: number;

  @ApiProperty({
    name: 'comments',
    description: 'Comments'
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  comments?: string;
}