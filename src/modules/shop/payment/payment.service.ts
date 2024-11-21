import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreatePaymentDto } from './dto/create-payment.dto';
import * as http from 'http';
import * as https from 'https';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  private authHeader: string;

  constructor(private configService: ConfigService) {
    const username = this.configService.get<string>('IZIPAY_PAYMENT_USERNAME');
    const password = this.configService.get<string>('IZIPAY_PAYMENT_PASSWORD');

    if (!username || !password) {
      throw new Error('API_USERNAME and API_PASSWORD must be set in environment variables.');
    }

    // Generar el header de autenticación Basic
    this.authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  }

  /**
   * Función para crear un pago
   * @param createPaymentDto Datos del pago
   * @returns Promesa con el formToken o lanza excepción
   */
  createPayment(createPaymentDto: CreatePaymentDto): Promise<string> {
    return new Promise((resolve, reject) => {
      const endpoint = this.configService.get<string>('IZIPAY_PAYMENT_ENDPOINT');
      if (!endpoint) {
        reject(new Error('API_ENDPOINT must be set in environment variables.'));
        return;
      }

      const postData = JSON.stringify(
        Object.keys(createPaymentDto).length === 0
          ? {
              amount: 200,
              currency: 'PEN',
              orderId: 'myOrderId-999999',
              customer: {
                email: 'sample@example.com'
              }
            }
          : createPaymentDto
      );

      const url = new URL(`${endpoint}/api-payment/V4/Charge/CreatePayment`);
      const options: http.RequestOptions | https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const protocol = url.protocol === 'https:' ? https : http;

      const req = protocol.request(options, (res) => {
        let data = '';

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const body = JSON.parse(data);

            if (body.status === 'SUCCESS') {
              const formToken = body.answer.formToken;
              resolve(formToken);
            } else {
              console.error('Error en la respuesta de la API:', body);
              reject(new InternalServerErrorException('Error en la creación del pago.'));
            }
          } catch (e) {
            console.error('Error al parsear la respuesta:', e);
            reject(new InternalServerErrorException('Error al procesar la respuesta de la API.'));
          }
        });
      });

      req.on('error', (e) => {
        console.error('Error en la solicitud:', e);
        reject(new InternalServerErrorException('Error al comunicarse con la API externa.'));
      });

      // Escribir los datos del POST
      req.write(postData);
      req.end();
    });
  }
}
