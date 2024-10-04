import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as https from 'https';

// Tenemos la obtencion del Token de Sesion
// TODO: Faltaria verificar el token de Authorization y la validacion de cuentas
@Injectable()
export class PaymentService {
  async getTokenSession(body: any, transactionId: string) {
    return new Promise((resolve, reject) => {
      const options = {
        host: 'sandbox-checkout.izipay.pe',
        port: 443,
        path: '/security/v1/Token/Generate',
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
          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (error) {
            reject(
              new HttpException('Error parsing token response', HttpStatus.INTERNAL_SERVER_ERROR)
            );
          }
        });
      });

      req.on('error', (error) => {
        reject(
          new HttpException(`Request error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
        );
      });

      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }
}
