import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateClientDto } from '../../auth/dto/create-client.dto';
import { IsDate, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateClientDto extends PartialType(
  OmitType(CreateClientDto, ['password', 'email'] as const)
) {
  @ApiProperty({
    name: 'name',
    description: 'Client name',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name?: string;

  @ApiProperty({
    name: 'phone',
    description: 'Client phone',
    required: false
  })
  @Transform(({ value }) => value.trim())
  @IsPhoneNumber(null)
  phone?: string;

  @ApiProperty({
    name: 'birthDate',
    description: 'Client birth date',
    required: false
  })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  birthDate?: Date;
}
