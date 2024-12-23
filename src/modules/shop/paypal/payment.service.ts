import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async createPayPalOrder(total: number, currency: string) {
    const PAYPAL_API = process.env.PAYPAL_API_URL;
    const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET;

    const auth = Buffer.from(`${PAYPAL_CLIENT}:${PAYPAL_SECRET}`).toString('base64');

    const order = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        // Detalle de lo que se esta pagando
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: total.toFixed(2)
            }
          }
        ]
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return order.data;
  }

  async capturePayPalOrder(orderId: string) {
    const PAYPAL_API = 'https://api-m.sandbox.paypal.com';
    const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

    const auth = Buffer.from(`${PAYPAL_CLIENT}:${PAYPAL_SECRET}`).toString('base64');

    const capture = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return capture.data;
  }

  async savePaymentDetails(orderId: string, paymentData: any) {
    return this.prisma.classRegister.updateMany({
      where: { paypalOrderId: orderId },
      data: {
        paypalOrderStatus: paymentData.status,
        paypalAmount: paymentData.purchase_units[0].amount.value,
        paypalCurrency: paymentData.purchase_units[0].amount.currency_code,
        paypalDate: paymentData.create_time
      }
    });
  }
}
