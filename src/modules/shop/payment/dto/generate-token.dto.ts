import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para generar un token de pago.
 */
export class GenerateTokenDto {
  /**
   * Fuente de la solicitud.
   * @example "web"
   */
  @ApiProperty({ example: 'ECOMMERCE', description: 'Fuente de la solicitud.' })
  @IsNotEmpty()
  @IsString()
  requestSource: string;

  /**
   * Código del comerciante.
   * @example "M123456"
   */
  @ApiProperty({ example: 'M123456', description: 'Código del comerciante.' })
  @IsNotEmpty()
  @IsString()
  merchantCode: string;

  /**
   * Número de orden.
   * @example "ORD123456"
   */
  @ApiProperty({ example: 'ORD123456', description: 'Número de orden.' })
  @IsNotEmpty()
  @IsString()
  orderNumber: string;

  /**
   * Clave pública.
   * @example "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
   */
  @ApiProperty({
    example: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA',
    description: 'Clave pública.'
  })
  @IsNotEmpty()
  @IsString()
  publicKey: string;

  /**
   * Monto de la transacción.
   * @example 100.50
   */
  @ApiProperty({ example: '10.50', description: 'Monto de la transacción.' })
  @IsNotEmpty()
  @IsString()
  amount: string;
}
