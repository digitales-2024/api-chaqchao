import { forwardRef, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { HttpResponse } from 'src/interfaces';
import { BillingDocumentData } from 'src/interfaces/billing-document.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import { OrderService } from '../order/order.service';
import { CreateBillingDocumentDto } from './dto/create-billing-document.dto';
import { UpdateStatusBillingDocumentDto } from './dto/update-status-billing.dto';

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
    const {
      billingDocumentType,
      documentNumber,
      totalAmount,
      paymentStatus,
      issuedAt,
      orderId,
      typeDocument,
      address,
      city,
      state,
      country,
      businessName
    } = createBillingDocumentDto;
    let newBillingDocument;

    try {
      newBillingDocument = await this.prisma.$transaction(async () => {
        const billingDocument = await this.prisma.billingDocument.create({
          data: {
            billingDocumentType: billingDocumentType || 'RECEIPT',
            documentNumber,
            typeDocument,
            address,
            city,
            state,
            country,
            totalAmount,
            paymentStatus: paymentStatus,
            issuedAt,
            orderId,
            businessName
          },
          select: {
            id: true,
            billingDocumentType: true,
            documentNumber: true,
            totalAmount: true,
            paymentStatus: true,
            issuedAt: true,
            address: true,
            city: true,
            state: true,
            country: true,
            businessName: true,
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
          issuedAt: newBillingDocument.issuedAt,
          address: newBillingDocument.address,
          city: newBillingDocument.city,
          state: newBillingDocument.state,
          country: newBillingDocument.country,
          typeDocument: newBillingDocument.typeDocument,
          businessName: newBillingDocument.businessName,
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

  /**
   * Actualiza solo el estado de un Billing Document
   * @param id Identificador del Billing Document
   * @param updateStatusBillingDocumentDto Contiene el nuevo estado del Billing Document
   * @returns Billing Document actualizado con el nuevo estado
   */
  async updateBillingDocumentStatus(
    id: string,
    updateStatusBillingDocumentDto: UpdateStatusBillingDocumentDto
  ): Promise<HttpResponse<BillingDocumentData>> {
    const { paymentStatus } = updateStatusBillingDocumentDto;

    try {
      // Actualizar solo el campo paymentStatus
      const updatedBillingStatus = await this.prisma.billingDocument.update({
        where: { id },
        data: { paymentStatus },
        select: {
          id: true,
          billingDocumentType: true,
          documentNumber: true,
          totalAmount: true,
          typeDocument: true,
          paymentStatus: true,
          issuedAt: true,
          orderId: true,
          address: true,
          city: true,
          state: true,
          country: true,
          businessName: true,
          order: {
            select: {
              id: true
            }
          }
        }
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Billing Document status updated successfully',
        data: {
          id: updatedBillingStatus.id,
          billingDocumentType: updatedBillingStatus.billingDocumentType,
          documentNumber: updatedBillingStatus.documentNumber,
          totalAmount: updatedBillingStatus.totalAmount,
          paymentStatus: updatedBillingStatus.paymentStatus,
          issuedAt: updatedBillingStatus.issuedAt,
          orderId: updatedBillingStatus.orderId,
          address: updatedBillingStatus.address,
          city: updatedBillingStatus.city,
          state: updatedBillingStatus.state,
          country: updatedBillingStatus.country,
          typeDocument: updatedBillingStatus.typeDocument,
          businessName: updatedBillingStatus.businessName,
          order: {
            id: updatedBillingStatus.order.id
          }
        }
      };
    } catch (error) {
      this.logger.error(`Error updating Billing Document status: ${error.message}`, error.stack);
      handleException(error, 'Error updating Billing Document status');
    }
  }
}
