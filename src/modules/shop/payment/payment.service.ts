// src/payment/payment.service.ts
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateTokenDto } from './dto/generate-token.dto';
import * as https from 'https';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    // this.apiUrl =
    //   this.configService.get<string>('IZIPAY_API_URL') ||
    //   'https://sandbox-checkout.izipay.pe/apidemo/v1';
    this.apiUrl = 'https://sandbox-checkout.izipay.pe';
  }

  /**
   * Generar un token mediante la API de Izipay
   * @param transactionId ID de la transacción
   * @param body Cuerpo de la solicitud
   * @returns Respuesta de Izipay
   */
  async generateToken(transactionId: string, body: GenerateTokenDto): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        const url = new URL('/apidemo/v1/Token/Generate', this.apiUrl);

        const options: https.RequestOptions = {
          hostname: url.hostname,
          port: 443,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            transactionId: transactionId
          }
        };

        const req = https.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            this.logger.debug(`Respuesta de Izipay: ${data}`);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsedData = JSON.parse(data);
                resolve(parsedData);
              } catch (e) {
                this.logger.error('Error al parsear la respuesta JSON de Izipay', e);
                reject(new HttpException('Respuesta inválida de Izipay', HttpStatus.BAD_GATEWAY));
              }
            } else {
              this.logger.error(`Izipay respondió con estado ${res.statusCode}: ${data}`);
              reject(
                new HttpException(
                  data || 'Error al generar el token',
                  res.statusCode || HttpStatus.BAD_GATEWAY
                )
              );
            }
          });
        });

        req.on('error', (error) => {
          this.logger.error('Error en la solicitud HTTPS a Izipay', error.message, error);
          reject(new HttpException('Error de conexión con Izipay', HttpStatus.BAD_GATEWAY));
        });

        // Escribe el cuerpo de la solicitud
        if (body) {
          req.write(JSON.stringify(body));
        }

        req.end();
      });
    } catch (error: any) {
      this.logger.error('Error al generar el token de Izipay', error.message, error.stack);
      throw new HttpException(
        error.response?.data || 'Error al generar el token',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
