import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import axios from 'axios';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private credentials: string;
  private base64Credentials: string;
  private authorizationHeader: string;
  constructor(private readonly config: ConfigService) {
    // Inicializar las variables
    this.credentials = `${this.config.get('IZIPAY_USERNAME')}:${this.config.get('IZIPAY_PASSWORD')}`;
    this.base64Credentials = Buffer.from(this.credentials).toString('base64');
    this.authorizationHeader = `Basic ${this.base64Credentials}`;
  }

  private readonly apiUrl = 'https://sandbox-api-pw.izipay.pe/security/v1/Token/Generate';
  private readonly validateAccountUrl =
    'https://sandbox-api-pw.izipay.pe/accountvalidate/v1/AccountControllers/Validate';

  /**
   * Método para crear el token de sesión en IZIPAY
   * El transactionId se enviará en los headers
   */
  async createSessionToken(
    transactionId: string,
    {
      requestSource = 'ECOMMERCE',
      merchantCode = '',
      orderNumber = '',
      publicKey = '',
      amount = ''
    }
  ) {
    try {
      this.logger.debug('Making POST request to IZIPAY Sandbox API with the following data:', {
        url: this.apiUrl,
        headers: {
          Authorization: this.authorizationHeader,
          transactionId
        },
        data: {
          requestSource,
          merchantCode,
          orderNumber,
          publicKey,
          amount
        }
      });

      // Solicitud HTTP a la API de IZIPAY Sandbox
      const response = await axios.post(
        this.apiUrl,
        {
          requestSource,
          merchantCode,
          orderNumber,
          publicKey,
          amount
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.authorizationHeader,
            transactionId
          },
          timeout: 5000
        }
      );

      // Registrar solo las partes clave de la respuesta
      this.logger.debug('Response from IZIPAY API:', {
        status: response.status,
        headers: response.headers,
        data: response.data
      });

      // Validar que la respuesta contenga el token en la ubicación correcta
      const token = response.data?.response?.token;

      if (!token) {
        this.logger.error('No session token found in the response', response.data);
        throw new HttpException('Failed to generate session token', HttpStatus.BAD_REQUEST);
      }

      this.logger.debug('Session token successfully generated:', token);
      return { token };
    } catch (error) {
      // Registrar información completa del error
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      } else {
        this.logger.error('Error during the API request:', error.message);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Método para validar la cuenta usando el token
   */
  async validateAccount(
    transactionId: string,
    token: string, // El token Bearer generado
    accountData: any
  ) {
    if (!token || token === 'undefined') {
      throw new HttpException('Token is missing or invalid', HttpStatus.BAD_REQUEST);
    }

    try {
      this.logger.debug(
        'Making POST request to IZIPAY Account Validation API with the following data:',
        {
          url: this.validateAccountUrl,
          headers: {
            Authorization: token, // Solo un Bearer
            transactionId
          },
          data: accountData
        }
      );

      // Solicitud HTTP a la API de Validación de IZIPAY
      const response = await axios.post(this.validateAccountUrl, accountData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token, // Token Bearer
          transactionId // TransactionId en los headers
        },
        timeout: 5000 // Timeout de 5 segundos
      });

      this.logger.debug('Response from IZIPAY Account Validation API:', response.data);

      if (response.data?.code !== '00') {
        this.logger.error('Account validation failed:', response.data);
        throw new HttpException('Failed to validate account', HttpStatus.BAD_REQUEST);
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      } else {
        this.logger.error('Error during the API request:', error.message);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * se completara
   */
  async postSDKTest(body: any) {
    try {
      return new Promise((resolve, reject) => {
        const options = {
          host: this.config.get('IZIPAY_URL'),
          port: 443,
          path: '/api-payment/V4/Charge/SDKTest',
          method: 'POST',
          headers: {
            Authorization: this.authorizationHeader,
            'Content-Type': 'application/json'
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

        // Envía el cuerpo de la solicitud (el "value")
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    } catch (error) {
      this.logger.error(`Internal Server Error: ${error.message}`, error.stack);
    }
  }

  /**
   * se completara
   */
  async postCreatePayment(body: any) {
    try {
      return new Promise((resolve, reject) => {
        const options = {
          host: this.config.get('IZIPAY_URL'),
          port: 443,
          path: '/api-payment/V4/Charge/CreatePayment',
          method: 'POST',
          headers: {
            Authorization: this.authorizationHeader,
            'Content-Type': 'application/json'
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

        // Envía el cuerpo de la solicitud (el "value")
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    } catch (error) {
      this.logger.error(`Internal Server Error: ${error.message}`, error.stack);
    }
  }

  /**
   * se completara
   */
  async postCreateToken(body: any) {
    try {
      return new Promise((resolve, reject) => {
        const options = {
          host: this.config.get('IZIPAY_URL'),
          port: 443,
          path: '/api-payment/V4/Charge/CreateToken',
          method: 'POST',
          headers: {
            Authorization: this.authorizationHeader,
            'Content-Type': 'application/json'
          }
        };

        // Definir el cuerpo de la solicitud con valores predefinidos
        body = {
          currency: 'PEN',
          customer: {
            email: 'sample@example.com'
          },
          orderId: 'myOrderId-849227'
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

        // Envía el cuerpo de la solicitud (el "value")
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    } catch (error) {
      this.logger.error(`Internal Server Error: ${error.message}`, error.stack);
    }
  }
}
