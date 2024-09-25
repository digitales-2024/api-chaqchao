import { forwardRef, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { BillingDocumentData } from 'src/interfaces/billing-document.interface';
import { handleException } from 'src/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBillingDocumentDto } from './dto/create-billing-document.dto';
import { HttpResponse } from 'src/interfaces';

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

  /**
   * Creacion de un nuevo Billing Document
   * @param createBillingDocumentDto Data del Billing Document
   * @returns Biliing Document creado
   */
  async create(
    createBillingDocumentDto: CreateBillingDocumentDto
  ): Promise<HttpResponse<BillingDocumentData>> {
    const { billingDocumentType, documentNumber, totalAmount, paymentStatus, issuedAt, orderId } =
      createBillingDocumentDto;
    let newBillingDocument;

    try {
      newBillingDocument = await this.prisma.$transaction(async () => {
        const billingDocument = await this.prisma.billingDocument.create({
          data: {
            billingDocumentType: billingDocumentType || 'RECEIPT',
            documentNumber,
            totalAmount,
            paymentStatus: paymentStatus || 'PENDING',
            issuedAt,
            orderId
          },
          select: {
            id: true,
            billingDocumentType: true,
            documentNumber: true,
            totalAmount: true,
            paymentStatus: true,
            issuedAt: true,
            order: {
              select: {
                id: true
              }
            }
          }
        });

        return billingDocument;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Billing Document created successfully',
        data: {
          id: newBillingDocument.id,
          billingDocumentType: newBillingDocument.billingDocumentType,
          documentNumber: newBillingDocument.documentNumber,
          totalAmount: newBillingDocument.totalAmount,
          paymentStatus: newBillingDocument.paymentStatus,
          orderId: newBillingDocument.orderId,
          order: {
            id: newBillingDocument.order.id
          }
        }
      };
    } catch (error) {
      this.logger.error(`Error creating Billing Document: ${error.message}`, error.stack);
      handleException(error, 'Error creating a Billing Document');
    }
  }
}
