import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreatePaymentDto } from './dto/create-payment.dto';
import * as http from 'http';
import * as https from 'https';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  private authHeader: string;
  private readonly hmacSecretKey: string;
  private readonly password: string;

  constructor(private configService: ConfigService) {
    this.hmacSecretKey = this.configService.get<string>('IZIPAY_HMAC_KEY');
    const username = this.configService.get<string>('IZIPAY_PAYMENT_USERNAME');
    this.password = this.configService.get<string>('IZIPAY_PAYMENT_PASSWORD');

    if (!username || !this.password) {
      throw new Error('API_USERNAME and API_PASSWORD must be set in environment variables.');
    }

    if (!this.hmacSecretKey) {
      throw new Error('HMAC_SECRET_KEY must be defined in environment variables');
    }
    // Generar el header de autenticación Basic
    this.authHeader = 'Basic ' + Buffer.from(`${username}:${this.password}`).toString('base64');
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

  /**
   * Valida el hash del pago
   * @param validatePaymentDto Datos de pago y hash
   * @returns Mensaje de validación
   */
  validatePayment(validatePaymentDto): boolean {
    const { hashKey, hash, rawClientAnswer } = validatePaymentDto;
    let generatedHash = '';

    // Convertir el objeto a JSON
    const message = JSON.stringify(rawClientAnswer);

    // Generar el hash del clientAnswer

    if (!hashKey) {
      throw new BadRequestException('Payment hash is required');
    }

    if (hashKey === 'sha256_hmac') {
      generatedHash = this.generateHmacSha256(JSON.parse(message), this.hmacSecretKey);
    } else if (hashKey === 'password') {
      generatedHash = this.generateHmacSha256(message, this.password);
    } else {
      return false;
    }
    if (hash === generatedHash) {
      return true;
    } else {
      throw new BadRequestException('Payment hash mismatch');
    }
  }

  generateHmacSha256(message: string, secretKey: string): string {
    return crypto.createHmac('sha256', secretKey).update(message).digest('hex');
  }
}
