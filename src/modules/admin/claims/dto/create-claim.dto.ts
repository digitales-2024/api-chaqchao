import { ApiProperty } from '@nestjs/swagger';
import { AssetType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsEmail,
  MaxLength,
  MinLength,
  IsPhoneNumber,
  IsDate
} from 'class-validator';

export class CreateClaimDto {
  @ApiProperty({
    description: 'Nombre del reclamante',
    example: 'John Doe'
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  claimantName: string;

  @ApiProperty({
    description: 'Dirección del reclamante',
    example: 'Av. Los Pinos 123, Lima, Perú',
    required: false
  })
  @IsOptional()
  @IsString()
  claimantAddress?: string;

  @ApiProperty({
    description: 'Número de documento del reclamante',
    example: '12345678'
  })
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  @IsString()
  documentNumber: string;

  @ApiProperty({
    description: 'Dirección de correo electrónico del reclamante',
    example: 'pDx5G@example.com'
  })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.trim())
  claimantEmail: string;

  @ApiProperty({
    description: 'Número de teléfono del reclamante',
    example: '+51987654321'
  })
  @IsNotEmpty()
  @IsPhoneNumber(null)
  @Transform(({ value }) => value.trim())
  @IsString()
  claimantPhone: string;

  @ApiProperty({
    description: 'Representante del reclamante',
    example: 'Jane Doe',
    required: false
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  claimantRepresentative?: string;

  @ApiProperty({
    description: 'Tipo de activo ofrecido',
    example: 'PRODUCT',
    enum: AssetType
  })
  @IsNotEmpty()
  @IsEnum(AssetType)
  assetType: AssetType;

  @ApiProperty({
    description: 'Cantidad asociada con el reclamo (si corresponde)',
    example: '1000',
    required: false
  })
  @IsString()
  @IsOptional()
  amountClaimed?: string;

  @ApiProperty({
    description: 'Descripción del activo ofrecido',
    example: 'Producto de la tienda'
  })
  @IsNotEmpty()
  @IsString()
  assetDescription: string;

  @ApiProperty({
    description: 'Descripción detallada del reclamo',
    example: 'El producto no funciona como se esperaba'
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  claimDescription: string;

  @ApiProperty({
    description: 'Fecha de reclamación',
    example: '2021-12-31T23:59:59Z'
  })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  dateClaim: Date;
}
