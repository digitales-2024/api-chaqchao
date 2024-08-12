import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name: string;

  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  description?: string;

  createdBy: string;

  updatedBy: string;
}
