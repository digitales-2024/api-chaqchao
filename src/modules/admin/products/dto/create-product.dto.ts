import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, IsUrl, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name: string;

  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsString()
  @IsUrl()
  image: string;

  @IsNotEmpty()
  @IsUUID()
  categoryId: string;
}
