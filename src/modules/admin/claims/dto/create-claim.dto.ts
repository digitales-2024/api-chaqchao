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
    name: 'claimantName',
    description: 'Name of the claimant'
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  claimantName: string;

  @ApiProperty({
    name: 'claimantAddress',
    description: 'Address of the claimant',
    required: false
  })
  @IsOptional()
  @IsString()
  claimantAddress?: string;

  @ApiProperty({
    name: 'documentNumber',
    description: 'Document number of the claimant'
  })
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  @IsString()
  documentNumber: string;

  @ApiProperty({
    name: 'claimantEmail',
    description: 'Email address of the claimant'
  })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.trim())
  claimantEmail: string;

  @ApiProperty({
    name: 'claimantPhone',
    description: 'Phone number of the claimant'
  })
  @IsNotEmpty()
  @IsPhoneNumber(null)
  @Transform(({ value }) => value.trim())
  @IsString()
  claimantPhone: string;

  @ApiProperty({
    name: 'claimantRepresentative',
    description: 'Representative of the claimant',
    required: false
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  claimantRepresentative?: string;

  @ApiProperty({
    name: 'assetType',
    description: 'Type of asset offered'
  })
  @IsNotEmpty()
  @IsEnum(AssetType)
  assetType: AssetType;

  @ApiProperty({
    name: 'amountClaimed',
    description: 'Amount associated with the claim (if applicable)',
    required: false
  })
  @IsString()
  @IsOptional()
  amountClaimed?: string;

  @ApiProperty({
    name: 'assetDescription',
    description: 'Description of the asset offered'
  })
  @IsNotEmpty()
  @IsString()
  assetDescription: string;

  @ApiProperty({
    name: 'claimDescription',
    description: 'Detailed description of the claim'
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  claimDescription: string;

  @ApiProperty({
    name: 'dateClaim',
    description: 'Date of claim'
  })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  dateClaim: Date;
}
