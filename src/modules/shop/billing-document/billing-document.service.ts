import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { BillingDocumentData } from 'src/interfaces/billing-document.interface';
import { handleException } from 'src/utils';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BillingDocumentService {
  private readonly logger = new Logger(BillingDocumentService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService
  ) {}

  /**
   * Mostrar todos los Billing Documents
   * @returns Todos los Billing Documents
   */

  async findAll(): Promise<BillingDocumentData[]> {
    try {
      const billingDocuments = await this.prisma.billingDocument.findMany({
        where: {},
        select: {
          id: true,
          paymentStatus: true,
          documentNumber: true,
          totalAmount: true,
          billingDocumentType: true,
          isActive: true,
          orderId: true,
          issuedAt: true
        }
      });
      // Mapea los resultados al tipo BillingDocumentData
      return billingDocuments.map((billingDocument) => ({
        id: billingDocument.id,
        paymentStatus: billingDocument.paymentStatus,
        documentNumber: billingDocument.documentNumber,
        totalAmount: billingDocument.totalAmount,
        billingDocumentType: billingDocument.billingDocumentType,
        orderId: billingDocument.orderId
      })) as BillingDocumentData[];
    } catch (error) {
      this.logger.error('Error getting all billing documents');
      handleException(error, 'Error getting all billing documents');
    }
  }
}
