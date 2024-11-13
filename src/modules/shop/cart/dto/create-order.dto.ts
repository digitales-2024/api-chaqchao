import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'Customer name', type: String })
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Customer email', type: String })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ description: 'Customer phone', type: String, required: false })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ description: 'Picktime of order', type: String })
  pickupTime: Date;

  @ApiProperty({ description: 'Someone Pickup ', type: String, default: false })
  someonePickup: boolean;

  @ApiProperty({ description: 'Comments', type: String, required: false })
  @IsOptional()
  @IsString()
  comments?: string;
}
