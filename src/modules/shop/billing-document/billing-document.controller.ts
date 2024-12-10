import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth } from 'src/modules/admin/auth/decorators';
import { BillingDocumentService } from './billing-document.service';
import { BillingDocumentData } from 'src/interfaces/billing-document.interface';
import { CreateBillingDocumentDto } from './dto/create-billing-document.dto';
import { HttpResponse } from 'src/interfaces';
import { UpdateStatusBillingDocumentDto } from './dto/update-status-billing.dto';

@ApiTags('Shop Billing')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
@ApiBadRequestResponse({ description: 'Bad Request' })
@Auth()
@Controller({
  path: 'billing-document',
  version: '1'
})
export class BillingDocumentController {
  constructor(private readonly billingDocumentService: BillingDocumentService) {}

  /**
   * Recupera todos los documentos de facturación.
   *
   * @returns Una promesa que resuelve una variedad de BillingDocumentData
   * que contiene los detalles de todos los documentos de facturación.
   */
  @Get()
  @ApiOperation({ summary: 'Obtenga todos los documentos de facturación' })
  @ApiOkResponse({ description: 'Documentos de facturación recuperados' })
  findAll(): Promise<BillingDocumentData[]> {
    return this.billingDocumentService.findAll();
  }

  /**
   * Crea un nuevo documento de facturación.
   *
   * @param createBillingDocumentDto - Datos necesarios para crear un nuevo documento de facturación.
   * @returns Una promesa que resuelve un HttpResponse que contiene los detalles del documento de facturación creado.
   */
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo documento de facturación' })
  @ApiCreatedResponse({ description: 'Documento de facturación creado' })
  @ApiBody({
    type: CreateBillingDocumentDto,
    description: 'Datos necesarios para crear un nuevo documento de facturación'
  })
  create(
    @Body() createBillingDocumentDto: CreateBillingDocumentDto
  ): Promise<HttpResponse<BillingDocumentData>> {
    return this.billingDocumentService.create(createBillingDocumentDto);
  }

  /**
   * Actualiza el estado de un documento de facturación.
   *
   * @param id - Identificador del documento de facturación.
   * @param updateStatusBillingDocumentDto - Contiene el nuevo estado del documento de facturación.
   * @returns Una promesa que resuelve un HttpResponse que contiene los detalles del documento de facturación actualizado.
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar el estado del documento de facturación' })
  @ApiOkResponse({ description: 'Documento de facturación actualizado' })
  @ApiBody({
    type: UpdateStatusBillingDocumentDto,
    description: 'Contiene el nuevo estado del documento de facturación'
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Identificador del documento de facturación'
  })
  async updateBillingDocumentStatus(
    @Param('id') id: string,
    @Body() updateStatusBillingDocumentDto: UpdateStatusBillingDocumentDto
  ): Promise<HttpResponse<BillingDocumentData>> {
    return this.billingDocumentService.updateBillingDocumentStatus(
      id,
      updateStatusBillingDocumentDto
    );
  }
}
