import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateClientDto } from '../../auth/dto/create-client.dto';
import { IsDate, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateClientDto extends PartialType(
  OmitType(CreateClientDto, ['password', 'email'] as const)
) {
  @ApiProperty({
    name: 'name',
    description: 'Nombre del cliente',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name?: string;

  @ApiProperty({
    name: 'phone',
    description: 'Teléfono del cliente',
    required: false
  })
  @Transform(({ value }) => value.trim())
  @IsPhoneNumber(null)
  phone?: string;

  @ApiProperty({
    name: 'birthDate',
    description: 'Fecha de nacimiento del cliente',
    required: false
  })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  birthDate?: Date;
}
